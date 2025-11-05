// /app/api/linkedin/post/route.ts
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { content, media, mediaType } = await req.json()
    console.log("📩 Incoming post request:", { content, hasMedia: !!media, mediaType })

    // Simulated stored LinkedIn access token
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
    if (!accessToken) {
      console.error("❌ No access token available")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let mediaAssetUrn = null

    // STEP 1: If there's media, register and upload
    if (media && mediaType) {
      console.log("🖼 Registering upload for media type:", mediaType)
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
              recipes: [
                mediaType === "image"
                  ? "urn:li:digitalmediaRecipe:feedshare-image"
                  : "urn:li:digitalmediaRecipe:feedshare-video",
              ],
              owner: "urn:li:person:me",
            },
          }),
        }
      )

      const registerJson = await registerRes.json()
      console.log("📤 Upload registration response:", registerJson)

      const uploadUrl =
        registerJson.value?.uploadMechanism?.[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ]?.uploadUrl
      mediaAssetUrn = registerJson.value?.asset

      if (uploadUrl) {
        console.log("⬆ Uploading file to LinkedIn CDN:", uploadUrl)
        const fileBuffer = Buffer.from(media.split(",")[1], "base64")
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": mediaType === "image" ? "image/jpeg" : "video/mp4" },
          body: fileBuffer,
        })
        console.log("✅ Upload result:", uploadRes.status)
      }
    }

    // STEP 2: Create the actual post
    const postBody: any = {
      author: "urn:li:person:me",
      commentary: content,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED" },
    }

    if (mediaAssetUrn) {
      console.log("📎 Attaching media asset:", mediaAssetUrn)
      postBody.content = {
        media: [
          {
            status: "READY",
            description: "Uploaded via LinkedPilot",
            media: mediaAssetUrn,
            title: "LinkedPilot Media",
          },
        ],
      }
    }

    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postBody),
    })

    const postJson = await postRes.json()
    console.log("🧾 LinkedIn post response:", postJson)

    if (!postRes.ok) {
      throw new Error(postJson.message || "LinkedIn post failed")
    }

    return NextResponse.json({ postId: postJson.id || "success" })
  } catch (err: any) {
    console.error("🔥 LinkedIn post route error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
