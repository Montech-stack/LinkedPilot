import { NextResponse } from "next/server";
import Automation from "@/models/Automation";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { addDays, addWeeks, addMonths } from "date-fns";
import { generateContent } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Secure the endpoint: Check for cron secret or valid session
    const authHeader = req.headers.get("authorization");
    const cronSecret = req.headers.get("x-cron-secret"); // Optional: if using X-Cron-Secret
    const isCron = authHeader === `Bearer ${process.env.VERCEL_CRON_SECRET}` || cronSecret === process.env.VERCEL_CRON_SECRET;

    let userId;
    if (!isCron) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.user.id;
      // Optional: Add admin check if needed, e.g., if (session.user.role !== 'admin') { return unauthorized }
    }

    await connectToDatabase();
    const now = new Date();

    // Fetch active content automations that are due
    // Filter by nextRun <= now
    const query = {
      type: "content",
      isActive: true,
    //   nextRun: { $lte: now },
      ...(isCron ? {} : { userId }) // Assuming automations have a userId field
    };

    const dueAutomations = await Automation.find(query);

    for (const automation of dueAutomations) {
      // Fetch current trending topics for uniqueness
      let trends = [];
      try {
        const trendsResponse = await fetch('https://getdaytrends.com/');
        const trendsHtml = await trendsResponse.text();
        const $ = cheerio.load(trendsHtml);
        $('ol.trend-card__list li a').each((i, el) => {
          if (i < 5) { // Top 5 trends
            trends.push($(el).text().trim());
          }
        });
      } catch (trendError) {
        console.error("Failed to fetch trends:", trendError);
        // Fallback: Use a default or skip
      }

      const trendsClause = trends.length > 0 
        ? `To make this post unique and timely, cleverly incorporate one or more of these current trending topics where relevant: ${trends.join(', ')}. Blend them naturally into the content without forcing it.`
        : '';

      // Additional clause for extra uniqueness (avoids generic AI output)
      const uniquenessClause = `Make the post completely original by adding unexpected twists, personal anecdotes, or references to current events around ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Avoid common AI-generated patterns like overused phrases (e.g., 'delve into', 'unleash potential') or repetitive structures. If no trends are available, draw from random elements like a hypothetical user story or seasonal vibe to ensure diversity.`;

      // Generate content using your existing logic (count=1 per run)
      const { topic: idea, tone, length } = automation;
      const count = 1; // One post per scheduled run
      const wordCount = length === 'short' ? '50-100 words' : length === 'medium' ? '100-200 words' : '200-300 words';
      const maxTokens = length === 'short' ? 200 : length === 'medium' ? 400 : 600;

      const prompt = `Generate ${count} highly engaging and relatable social media post(s) with a ${tone} tone based on the idea: "${idea}". Optimize for maximum virality across platforms like LinkedIn, Twitter (X), Facebook, Instagram, and TikTok, ensuring they can go viral on every platform.

${trendsClause}
${uniquenessClause}

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

      // Post to each selected account via /api/social/post
      let postSuccess = true;
      for (const accountId of automation.selectedAccounts) {
        const account = await SocialAccount.findById(accountId);
        if (account && account.connected) {
          // Conditional headers for dual auth
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (isCron) {
            headers['x-cron-secret'] = process.env.VERCEL_CRON_SECRET || ''; // Use lowercase for consistency
          } else {
            // Forward cookies to propagate session for non-cron calls
            const cookie = req.headers.get('cookie');
            if (cookie) {
              headers['Cookie'] = cookie;
            }
          }

          const postRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/social/post`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              platform: account.platform,
              accountId: account._id,
              content,
              media: null,
              mediaType: null
            })
          });

          if (!postRes.ok) {
            console.error(`Failed to post for account ${accountId}: ${postRes.statusText}`);
            postSuccess = false;
          }
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