// lib/postToLinkedIn.ts
import LinkedInUser from "@/models/LinkedInUser";
import SocialAccount from "@/models/SocialAccount";
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
      // Mark account as disconnected so UI reflects this
      await SocialAccount.updateOne({ linkedinId: memberId }, { $set: { connected: false } });
      throw new Error("Your LinkedIn session has expired. Please reconnect your account in Settings → Connected Accounts.");
    }
  }
  // Text-only post
  if (!media) {
    const postBody = {
      author: `urn:li:person:${memberId}`,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    };
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202511" // Updated to latest active version
      },
      body: JSON.stringify(postBody),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to post text: ${errorText}`);
    }
    const postId = response.headers.get("x-restli-id");
    return { success: true, postId };
  }
  // Media handling (image/video)
  let base64;
  if (media.startsWith("data:")) {
    base64 = media.split(",")[1];
  } else {
    base64 = media; // Assume pure base64 if no prefix
  }
  if (!base64) {
    throw new Error("Invalid media format");
  }
  const buffer = Buffer.from(base64, "base64");
  const contentType = mediaType?.includes("image") ? "image/png" : "video/mp4"; // Adjust for video if needed

  // Step 1: Initialize upload (v3 Images API)
  const initializeRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202511" // Updated to latest active version
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: `urn:li:person:${memberId}`
      }
    }),
  });
  if (!initializeRes.ok) {
    const errorText = await initializeRes.text();
    throw new Error(`Failed to initialize upload: ${errorText}`);
  }
  const uploadInfo = await initializeRes.json();
  const uploadUrl = uploadInfo.value.uploadUrl;
  const assetUrn = uploadInfo.value.image; // urn:li:image:...

  // Step 2: Upload media binary
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType
    },
    body: buffer,
  });
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload ${mediaType}: ${errorText}`);
  }

  // Step 3: Create post with media (v3 Posts API)
  const postBody = {
    author: `urn:li:person:${memberId}`,
    commentary: content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    content: {
      media: {
        id: assetUrn,
        title: "Post Image",
        altText: "Generated post image"
      }
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false
  };
  const linkedInResponse = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202511" // Updated to latest active version
    },
    body: JSON.stringify(postBody),
  });
  if (!linkedInResponse.ok) {
    const errorText = await linkedInResponse.text();
    throw new Error(`Failed to create post: ${errorText}`);
  }
  const postId = linkedInResponse.headers.get("x-restli-id");
  return { success: true, postId, message: `Successfully posted ${mediaType} to LinkedIn!` };
}