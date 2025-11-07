import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LinkedInUser from "@/models/LinkedInUser";
import { refreshLinkedInToken } from "@/lib/linkedinRefresh";

export async function POST(request: NextRequest) {
  try {
    const { content, media, mediaType } = await request.json();

    if (!content) {
      return NextResponse.json({ success: false, error: "No content provided" }, { status: 400 });
    }

    const memberId = request.cookies.get("linkedin_member_id")?.value;
    if (!memberId) {
      return NextResponse.json({ success: false, error: "Not connected to LinkedIn" }, { status: 401 });
    }

    await connectToDatabase();
    let user = await LinkedInUser.findOne({ linkedinId: memberId });

    if (!user) {
      return NextResponse.json({ success: false, error: "No LinkedIn account found" }, { status: 401 });
    }

    // Refresh token if expired
    let accessToken = user.accessToken;
    if (user.expiresAt && user.expiresAt < new Date()) {
      const refreshed = await refreshLinkedInToken(memberId);
      if (refreshed) accessToken = refreshed;
      else return NextResponse.json({ success: false, error: "Token refresh failed" }, { status: 401 });
    }

    // --------------------
    // NO MEDIA? Post text
    // --------------------
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

      const linkedInResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postBody),
      });

      const result = await linkedInResponse.json();
      return NextResponse.json({ success: true, result });
    }

    // Parse Base64
    const base64 = media.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    // ===================================================================
    // IMAGE UPLOAD
    // ===================================================================
    if (mediaType === "image") {
      const registerRes = await fetch(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
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
        }
      );

      const uploadInfo = await registerRes.json();
      const uploadUrl =
        uploadInfo.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;

      const asset = uploadInfo.value.asset;

      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: buffer,
      });

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

      const linkedInResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postBody),
      });

      const result = await linkedInResponse.json();

      return NextResponse.json({
        success: true,
        postId: result.id,
        message: "Successfully posted image to LinkedIn!",
      });
    }

    // ===================================================================
    // VIDEO UPLOAD
    // ===================================================================
    if (mediaType === "video") {
      const registerRes = await fetch(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
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
        }
      );

      const uploadInfo = await registerRes.json();
      const uploadUrl =
        uploadInfo.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;

      const asset = uploadInfo.value.asset;

      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
        },
        body: buffer,
      });

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

      const linkedInResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(postBody),
      });

      const result = await linkedInResponse.json();

      return NextResponse.json({
        success: true,
        postId: result.id,
        message: "Successfully posted video to LinkedIn!",
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported mediaType" }, { status: 400 });

  } catch (error) {
    console.error("LinkedIn post error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
