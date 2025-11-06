import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// 🔹 Helper: Upload image to LinkedIn
async function uploadImage(accessToken: string, author: string, mediaUrl: string, content: string) {
  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: author,
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  })

  const registerData = await registerRes.json()
  const uploadUrl =
    registerData.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl
  const asset = registerData.value.asset

  // Upload image bytes
  const imgBlob = await fetch(mediaUrl).then((r) => r.blob())
  await fetch(uploadUrl, {
    method: "PUT",
    body: imgBlob,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": imgBlob.type,
    },
  })

  return [
    {
      status: "READY",
      description: { text: content },
      media: asset,
      title: { text: "Post" },
    },
  ]
}

// 🔹 Helper: Upload video (chunked)
async function uploadVideo(accessToken: string, author: string, mediaUrl: string, content: string) {
  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: author,
        recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  })

  const registerData = await registerRes.json()
  const uploadInstructions =
    registerData.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadInstructions
  const asset = registerData.value.asset

  const videoArrayBuffer = await fetch(mediaUrl).then((r) => r.arrayBuffer())
  const videoBytes = new Uint8Array(videoArrayBuffer)

  for (const instruction of uploadInstructions) {
    const { uploadUrl, firstByte, lastByte } = instruction
    const chunk = videoBytes.slice(firstByte, lastByte + 1)

    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: chunk,
    })
  }

  return [
    {
      status: "READY",
      description: { text: content },
      media: asset,
      title: { text: "Post" },
    },
  ]
}

// 🟢 Main LinkedIn Post Route
export async function POST(req: Request) {
  try {
    const { content, media, mediaType } = await req.json()
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("linkedin_access_token")?.value
    const memberId = cookieStore.get("linkedin_member_id")?.value

    if (!accessToken || !memberId) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 401 })
    }

    const author = `urn:li:member:${memberId}`
    let mediaList: any[] = []

    // 🔹 Upload media if provided
    if (media && mediaType === "image") {
      mediaList = await uploadImage(accessToken, author, media, content)
    } else if (media && mediaType === "video") {
      mediaList = await uploadVideo(accessToken, author, media, content)
    }

    // 🔹 Build the post payload
    const postBody = {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: media
            ? mediaType === "video"
              ? "VIDEO"
              : "IMAGE"
            : "NONE",
          ...(mediaList.length ? { media: mediaList } : {}),
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }

    // 🔹 Publish the post
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postBody),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`LinkedIn API error: ${error}`)
    }

    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("🔥 LinkedIn post error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
