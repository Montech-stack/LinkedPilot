// lib/postToLinkedIn.ts
import LinkedInUser from "@/models/LinkedInUser";
import { refreshLinkedInToken } from "@/lib/linkedinRefresh";

export async function postToLinkedIn({
  memberId,
  content,
  media,
  mediaType,
}: {
  memberId: string;
  content: string;
  media?: string;
  mediaType?: "image" | "video";
}) {
  let user = await LinkedInUser.findOne({ linkedinId: memberId });
  if (!user) {
    throw new Error("No LinkedIn user found");
  }
  // Refresh token if expired
  let accessToken = user.accessToken;
  if (user.expiresAt && user.expiresAt < new Date()) {
    const refreshed = await refreshLinkedInToken(memberId);
    if (refreshed) {
      accessToken = refreshed;
    } else {
      throw new Error("Token refresh failed");
    }
  }
  // Text-only post
  if (!media) {
    const postBody = {
      author: `urn:li:person:${memberId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });
    if (!response.ok) throw new Error("Failed to post text");
    return { success: true, result: await response.json() };
  }
  // Media handling (image/video) - adapted from your code
  const base64 = media.split(",")[1];
  const buffer = Buffer.from(base64, "base64");
  const recipes = mediaType === "image" ? ["urn:li:digitalmediaRecipe:feedshare-image"] : ["urn:li:digitalmediaRecipe:feedshare-video"];
  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes,
        owner: `urn:li:person:${memberId}`,
        serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
      },
    }),
  });
  if (!registerRes.ok) throw new Error("Failed to register upload");
  const uploadInfo = await registerRes.json();
  const uploadUrl = uploadInfo.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const asset = uploadInfo.value.asset;
  const contentType = mediaType === "image" ? "image/jpeg" : "video/mp4";
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });
  if (!uploadResponse.ok) throw new Error(`Failed to upload ${mediaType}`);
  const postBody = {
    author: `urn:li:person:${memberId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: mediaType.toUpperCase(),
        media: [{ status: "READY", media: asset }],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const linkedInResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(postBody),
  });
  if (!linkedInResponse.ok) throw new Error("Failed to create post");
  const result = await linkedInResponse.json();
  return { success: true, postId: result.id, message: `Successfully posted ${mediaType} to LinkedIn!` };
}