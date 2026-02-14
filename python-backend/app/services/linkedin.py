"""LinkedIn API v3 client for posting content.

Mirrors the logic in lib/postToLinkedIn.ts (v3 REST API).
"""

import httpx
from app.mongodb import get_mongo_db
import logging

logger = logging.getLogger(__name__)


async def get_linkedin_user(member_id: str) -> dict | None:
    """Get LinkedIn user data from MongoDB."""
    db = get_mongo_db()
    user = db.linkedinusers.find_one({"linkedinId": member_id})
    return user


async def refresh_token_if_needed(user: dict) -> str:
    """Check if token is expired and refresh if needed.

    Returns the valid access token.
    """
    from datetime import datetime, timezone

    access_token = user.get("accessToken", "")
    expires_at = user.get("expiresAt")

    if expires_at and expires_at < datetime.now(timezone.utc):
        # Attempt refresh
        refresh_token = user.get("refreshToken")
        if not refresh_token:
            raise ValueError("No refresh token available and access token expired")

        from app.config import get_settings
        settings = get_settings()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": settings.linkedin_client_id,
                    "client_secret": settings.linkedin_client_secret,
                },
            )

            if response.status_code != 200:
                raise ValueError(f"Token refresh failed: {response.text}")

            data = response.json()
            new_token = data["access_token"]
            expires_in = data.get("expires_in", 5184000)

            # Update MongoDB
            db = get_mongo_db()
            db.linkedinusers.update_one(
                {"linkedinId": user["linkedinId"]},
                {
                    "$set": {
                        "accessToken": new_token,
                        "expiresAt": datetime.now(timezone.utc).timestamp() + expires_in,
                    }
                },
            )
            return new_token

    return access_token


async def post_text_to_linkedin(member_id: str, access_token: str, content: str) -> dict:
    """Post text-only content to LinkedIn using v3 Posts API."""
    post_body = {
        "author": f"urn:li:person:{member_id}",
        "commentary": content,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.linkedin.com/rest/posts",
            json=post_body,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202511",
            },
        )

        if response.status_code not in (200, 201):
            raise ValueError(f"LinkedIn post failed: {response.text}")

        post_id = response.headers.get("x-restli-id")
        return {"success": True, "postId": post_id}


async def post_with_image_to_linkedin(
    member_id: str, access_token: str, content: str, image_data: bytes
) -> dict:
    """Post content with an image to LinkedIn using v3 Images + Posts API."""

    async with httpx.AsyncClient() as client:
        # Step 1: Initialize upload
        init_response = await client.post(
            "https://api.linkedin.com/rest/images?action=initializeUpload",
            json={"initializeUploadRequest": {"owner": f"urn:li:person:{member_id}"}},
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202511",
            },
        )

        if init_response.status_code not in (200, 201):
            raise ValueError(f"Image upload init failed: {init_response.text}")

        upload_info = init_response.json()
        upload_url = upload_info["value"]["uploadUrl"]
        asset_urn = upload_info["value"]["image"]

        # Step 2: Upload image binary
        upload_response = await client.put(
            upload_url,
            content=image_data,
            headers={"Content-Type": "image/png"},
        )

        if upload_response.status_code not in (200, 201):
            raise ValueError(f"Image upload failed: {upload_response.text}")

        # Step 3: Create post with image
        post_body = {
            "author": f"urn:li:person:{member_id}",
            "commentary": content,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": [],
            },
            "content": {
                "media": {
                    "id": asset_urn,
                    "title": "Post Image",
                    "altText": "Generated post image",
                }
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False,
        }

        post_response = await client.post(
            "https://api.linkedin.com/rest/posts",
            json=post_body,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202511",
            },
        )

        if post_response.status_code not in (200, 201):
            raise ValueError(f"LinkedIn image post failed: {post_response.text}")

        post_id = post_response.headers.get("x-restli-id")
        return {"success": True, "postId": post_id}


async def publish_scheduled_post(
    linkedin_id: str, content: str, media: str | None = None, media_type: str | None = None
) -> dict:
    """High-level function to publish a scheduled post to LinkedIn."""
    user = await get_linkedin_user(linkedin_id)
    if not user:
        raise ValueError(f"LinkedIn user not found: {linkedin_id}")

    access_token = await refresh_token_if_needed(user)

    if not media:
        return await post_text_to_linkedin(linkedin_id, access_token, content)

    # Handle base64 media
    import base64

    if media.startswith("data:"):
        media = media.split(",")[1]

    image_data = base64.b64decode(media)
    return await post_with_image_to_linkedin(linkedin_id, access_token, content, image_data)
