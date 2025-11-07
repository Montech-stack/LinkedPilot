import LinkedInUser from "@/models/LinkedInUser";
import { connectToDatabase } from "@/lib/mongodb";

export async function refreshLinkedInToken(userId: string) {
  await connectToDatabase();
  const user = await LinkedInUser.findOne({ linkedinId: userId });
  if (!user || !user.refreshToken) return null;

  // Only refresh if token has expired
  if (user.expiresAt && user.expiresAt > new Date()) {
    return user.accessToken;
  }

  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    const data = await res.json();

    if (data.access_token) {
      user.accessToken = data.access_token;
      user.expiresAt = new Date(Date.now() + data.expires_in * 1000);
      await user.save();
      return user.accessToken;
    }

    console.error("LinkedIn refresh failed:", data);
    return null;
  } catch (error) {
    console.error("Error refreshing LinkedIn token:", error);
    return null;
  }
}
