import { connectToDatabase } from "@/lib/mongodb";
import LinkedInUser from "@/models/LinkedInUser";
import ScheduledPost, { IScheduledPost } from "@/models/ScheduledPost";
import { refreshLinkedInToken } from "@/lib/linkedinRefresh";

// NOTE: This duplicates the posting logic you had on /api/linkedin/post,
// consolidated here so cron + other callers can reuse the same flow.

export async function publishToLinkedIn(postDoc: IScheduledPost) {
  await connectToDatabase();

  const memberId = postDoc.linkedinId;
  if (!memberId) throw new Error("No linkedIn member id on post");

  const user = await LinkedInUser.findOne({ linkedinId: memberId });
  if (!user) throw new Error("LinkedIn user not found");

  // Refresh token if needed
  let accessToken = user.accessToken;
  if (user.expiresAt && user.expiresAt < new Date()) {
    const refreshed = await refreshLinkedInToken(memberId);
    if (!refreshed) throw new Error("Token refresh failed");
    accessToken = refreshed;
  }

  const { content, media, mediaType } = postDoc;

  // helper to POST to ugcPosts
  const createUGCPost = async (body: any) => {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      const err = (json && json.message) || JSON.stringify(json);
      throw new Error("LinkedIn UGC error: " + err);
    }
    return json;
  };

  // 1) TEXT ONLY
  if (!media) {
    const postBody = {
      author: `urn:li:person:${user.linkedinId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const result = await createUGCPost(postBody);
    return result;
  }

  // convert base64 -> buffer
  const base64 = media.split(",")[1];
  const buffer = Buffer.from(base64, "base64");

  // 2) IMAGE flow
  if (mediaType === "image") {
    // register upload
    const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: `urn:li:person:${user.linkedinId}`,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    });

    const uploadInfo = await registerRes.json();
    if (!registerRes.ok) throw new Error("Image register failed: " + JSON.stringify(uploadInfo));

    const uploadUrl =
      uploadInfo.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const asset = uploadInfo.value.asset;

    // upload binary
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: buffer,
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      throw new Error("Image upload failed: " + txt);
    }

    // create post referencing asset
    const postBody = {
      author: `urn:li:person:${user.linkedinId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "IMAGE",
          media: [{ status: "READY", media: asset }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const result = await createUGCPost(postBody);
    return result;
  }

  // 3) VIDEO flow (use registerUpload with video recipe)
  if (mediaType === "video") {
    // register upload for video
    const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
          owner: `urn:li:person:${user.linkedinId}`,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    });

    const uploadInfo = await registerRes.json();
    if (!registerRes.ok) throw new Error("Video register failed: " + JSON.stringify(uploadInfo));

    const uploadUrl =
      uploadInfo.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const asset = uploadInfo.value.asset;

    // upload binary video (LinkedIn expects the raw bytes)
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: buffer,
    });
    if (!putRes.ok) {
      const txt = await putRes.text();
      throw new Error("Video upload failed: " + txt);
    }

    // create post referencing the video asset
    const postBody = {
      author: `urn:li:person:${user.linkedinId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "VIDEO",
          media: [{ status: "READY", media: asset }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const result = await createUGCPost(postBody);
    return result;
  }

  throw new Error("Unsupported mediaType in publishToLinkedIn");
}
