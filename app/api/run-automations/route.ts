import { NextResponse } from "next/server";
import Automation from "@/models/Automation";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { addDays, addWeeks, addMonths } from "date-fns";
import { generateContent } from "@/lib/gemini";
import { postToLinkedIn } from "@/lib/postToLinkedIn"; // Assuming this is exported from your posting lib

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Secure the endpoint (add VERCEL_CRON_SECRET to your env)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const now = new Date();

    // Fetch active content automations that are due
    const dueAutomations = await Automation.find({
      type: "content",
      isActive: true,
      nextRun: { $lte: now },
    });

    for (const automation of dueAutomations) {
      // Generate content using your existing logic (count=1 per run)
      const { topic: idea, tone, length } = automation;
      const count = 1; // One post per scheduled run
      const wordCount = length === 'short' ? '50-100 words' : length === 'medium' ? '100-200 words' : '200-300 words';
      const maxTokens = length === 'short' ? 200 : length === 'medium' ? 400 : 600;

      const prompt = `Generate ${count} highly engaging and relatable social media post(s) with a ${tone} tone based on the idea: "${idea}". Optimize for maximum virality across platforms like LinkedIn, Twitter (X), Facebook, Instagram, and TikTok, ensuring they can go viral on every platform.

Each post should:
- Be approximately ${wordCount} to fit platform limits (e.g., shorter for Twitter, more detailed for LinkedIn).
- Start with a powerful hook using curiosity, urgency, FOMO, or a provocative question to stop the scroll.
- Incorporate psychological triggers like storytelling, social proof, actionable insights, or emotional power words to boost shares and interactions.
- Use 3-8 relevant emojis for visual pop without overkill.
- End with a strong call-to-action and encourage them to follow for more (e.g., "What's your take? Drop a comment!", "Tag a friend who needs this!", "DM me for details!", or "Share if this resonates!").
- Include 3-5 targeted hashtags for discoverability (e.g., #ViralTopic, #IndustryInsight).
- Vary structures for uniqueness: e.g., question-based, listicle, story, tip, quote, or poll-style.
- Keep language conversational, relatable, and jargon-free unless topic-specific. Do not use asterisks (*) for emphasis or any purpose in the content—use emojis or rephrase instead.
- Ensure adaptability: Professional tone for LinkedIn, fun/concise for TikTok/Instagram, engaging for Facebook/Twitter.

Return a JSON array of ${count} objects, each with:
{
  "id": string (format: "${Date.now()}-{index}/${count}", e.g., "1760048817326-0/6"),
  "content": string (the full post text, ready to share),
  "engagement": "Very High" | "High" | "Medium" (estimated virality based on triggers and platform fit),
  "score": number (70-95, reflecting quality, originality, and engagement potential)
}

Output only a valid JSON array—no other text. Ensure diversity and high viral potential in each post.`;

      const generatedContent = await generateContent(prompt, { maxTokens: 3000 });

      // Clean and parse (adapted from your generate route)
      let cleanedContent = generatedContent
        .replace(/```json\n|\n```/g, '')
        .replace(/```/g, '')
        .trim();

      let posts;
      try {
        posts = JSON.parse(cleanedContent);
      } catch (error) {
        // Fallback handling (simplified)
        posts = [{ content: `Generated post for "${idea}" in ${tone} tone (${wordCount}).` }];
      }

      const content = posts[0]?.content?.replace(/\*/g, '') || ''; // Get first (only) post content, remove asterisks

      if (!content) {
        console.error(`Failed to generate content for automation ${automation._id}`);
        continue;
      }

      // Post to each selected account
      let postSuccess = true;
      for (const accountId of automation.selectedAccounts) {
        const account = await SocialAccount.findById(accountId);
        if (account && account.connected) {
          let posted;
          if (account.platform.toLowerCase() === "linkedin") {
            const memberId = account.linkedinId;
            if (memberId) {
              posted = await postToLinkedIn({ memberId, content, media: null, mediaType: null }); // Add media if needed later
            }
          } else {
            // Add handlers for other platforms (e.g., postToX, postToFacebook) as you implement them
            console.warn(`Platform ${account.platform} not yet supported`);
            posted = false;
          }
          if (!posted) postSuccess = false;
        }
      }

      if (postSuccess) {
        // Update automation
        automation.lastRun = now;
        automation.count += 1;
        automation.nextRun = calculateNextRun(now, automation.frequency);
        await automation.save();
      }
    }

    return NextResponse.json({ message: "Automations processed successfully" });
  } catch (error) {
    console.error("Error running automations:", error);
    return NextResponse.json({ error: "Failed to run automations" }, { status: 500 });
  }
}

// Helper: Calculate next run
function calculateNextRun(current: Date, frequency: string): Date {
  switch (frequency) {
    case "daily":
      return addDays(current, 1);
    case "weekly":
      return addWeeks(current, 1);
    case "monthly":
      return addMonths(current, 1);
    default:
      return addDays(current, 1); // Fallback
  }
}