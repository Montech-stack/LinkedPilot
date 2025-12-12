import { NextResponse } from "next/server";
import Automation from "@/models/Automation";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { generateContent } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import * as cheerio from "cheerio";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";

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
      // nextRun: { $lte: now },
      ...(isCron ? {} : { userId }) // Assuming automations have a userId field
    };
    console.log(`Fetching due automations with query: ${JSON.stringify(query)}`);

    const dueAutomations = await Automation.find(query);
    console.log(`Found ${dueAutomations.length} due automations`);

    for (const automation of dueAutomations) {
      console.log(`Processing automation ${automation._id}, automateImages: ${automation.automateImages}, profileImageUrl: ${automation.profileImageUrl}, username: ${automation.username}`);
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
        console.log(`Fetched trends: ${trends.join(', ')}`);
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

      const prompt = `Generate ${count} highly engaging and relatable social media post(s) with a ${tone} tone based on the idea: "${idea}". Optimize for maximum virality on LinkedIn according to 2024-2025 algorithm insights: Prioritize early engagement in the first 60 minutes with curiosity/contrarian hooks, dwell time through personal stories/proof, and comments via strong CTAs. Favor poll-style, carousel-idea, or text+image suggestions. Avoid promotional tone, external links in body, and generic/AI patterns. Use multiple short paragraphs for scannability, incorporate 3-8 relevant emojis strategically to enhance visual appeal and emotional connection without overkill.

${trendsClause}
${uniquenessClause}

Each post should:
- Be approximately ${wordCount} (900-2100 chars for LinkedIn).
- Start with a curiosity/contrarian/number-based hook (e.g., "You're doing X wrong—here's why" or "I analyzed 100 posts—top insight") to stop scrolls in the golden hour.
- Build with a personal story/anecdote for relatability (1-2 paras, add proof like data/screenshots).
- Provide 2-4 actionable insights/tips in bullets/lists for dwell time.
- Use 3-8 relevant emojis for visual pop without overkill.
- End with a strong CTA/question to spark comments (e.g., "What's your take? Comment below!" or "Comment 'GUIDE' for free template").
- Include 3-5 targeted hashtags at end.
- Vary structures for uniqueness: e.g., question-based, listicle, story, tip, quote, or poll-style.
- Keep language conversational, relatable, and jargon-free unless topic-specific. Do not use asterisks (*) for emphasis or any purpose in the content—use emojis or rephrase instead.
- Ensure professional yet engaging tone for LinkedIn.

Return a JSON array of ${count} objects, each with:
{
  "id": string (format: "${Date.now()}-{index}/${count}", e.g., "1760048817326-0/6"),
  "content": string (the full post text, ready to share),
  "hook": string (the powerful opening hook, which is the first sentence or phrase),
}

Output only a valid JSON array—no other text. Ensure diversity and high viral potential in each post.`;

      console.log('Generating content with prompt length:', prompt.length);
      const generatedContent = await generateContent(prompt, { maxTokens: 3000 });
      console.log('Generated content:', generatedContent.substring(0, 200) + '...');

      // Clean and parse (adapted from your generate route)
      let cleanedContent = generatedContent
        .replace(/```json\n|\n```/g, '')
        .replace(/```/g, '')
        .trim();

      let posts;
      try {
        posts = JSON.parse(cleanedContent);
        console.log('Parsed posts:', posts);
      } catch (error) {
        console.error('Failed to parse generated content:', error);
        // Fallback handling (simplified)
        posts = [{ content: `Generated post for "${idea}" in ${tone} tone (${wordCount}).`, hook: `Generated hook for "${idea}".` }];
      }

      const content = posts[0]?.content?.replace(/\*/g, '') || ''; // Get first (only) post content, remove asterisks
      const hook = posts[0]?.hook || content.split('.')[0].trim() + '.'; // Use hook if available, fallback to first sentence
      console.log('Final content:', content.substring(0, 200) + '...');
      console.log('Hook for image:', hook);

      if (!content) {
        console.error(`Failed to generate content for automation ${automation._id}`);
        continue;
      }

      // Post to each selected account via /api/social/post
      let postSuccess = true;
      for (const accountId of automation.selectedAccounts) {
        const account = await SocialAccount.findById(accountId);
        if (account && account.connected) {
          console.log(`Posting to account ${accountId}, platform: ${account.platform}`);
          let base64Image: string | null = null;
          if (automation.automateImages) {
            console.log('Starting image generation');
            // Ensure /tmp directory exists
            fs.mkdirSync('/tmp', { recursive: true });
            console.log('/tmp directory ensured');

            // Fetch and register fonts if not present
            const tmpChirpFontPath = '/tmp/Chirp-Regular.ttf';
            const tmpEmojiFontPath = '/tmp/NotoColorEmoji.ttf';
            if (!fs.existsSync(tmpChirpFontPath)) {
              console.log('Fetching Chirp font');
              const chirpFontRes = await fetch('https://abs.twimg.com/fonts/v1/chirp-regular.woff');
              if (chirpFontRes.ok) {
                const fontBuffer = await chirpFontRes.arrayBuffer();
                fs.writeFileSync(tmpChirpFontPath, Buffer.from(fontBuffer));
                console.log('Chirp font saved');
              } else {
                console.error('Failed to fetch Chirp font, falling back to Arial');
                // Fetch Arial as fallback
                const arialRes = await fetch('https://raw.githubusercontent.com/root-project/root/master/fonts/arial.ttf');
                if (arialRes.ok) {
                  const arialBuffer = await arialRes.arrayBuffer();
                  fs.writeFileSync(tmpChirpFontPath, Buffer.from(arialBuffer));
                }
              }
            } else {
              console.log('Chirp font already exists');
            }
            if (!fs.existsSync(tmpEmojiFontPath)) {
              console.log('Fetching Noto Color Emoji font');
              const emojiFontRes = await fetch('https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf');
              if (emojiFontRes.ok) {
                const fontBuffer = await emojiFontRes.arrayBuffer();
                fs.writeFileSync(tmpEmojiFontPath, Buffer.from(fontBuffer));
                console.log('Emoji font saved');
              } else {
                console.error('Failed to fetch emoji font');
              }
            } else {
              console.log('Emoji font already exists');
            }
            try {
              if (fs.existsSync(tmpChirpFontPath)) {
                registerFont(tmpChirpFontPath, { family: 'Chirp' });
                console.log('Registered Chirp font');
              }
            } catch (fontError) {
              console.error('Failed to register Chirp font:', fontError);
            }
            try {
              if (fs.existsSync(tmpEmojiFontPath)) {
                registerFont(tmpEmojiFontPath, { family: 'Noto Color Emoji' });
                console.log('Registered emoji font');
              }
            } catch (fontError) {
              console.error('Failed to register emoji font:', fontError);
            }

            // Generate image mimicking tweet format
            const canvasWidth = 600;
            const canvasHeight = 400; // Taller for better spacing
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // Twitter dark mode background
            ctx.fillStyle = '#15202b';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            console.log('Filled dark background');

            // Padding and alignment
            const padding = 40; // Increased padding for appeal

            // Measure header height
            const headerHeight = 60; // Approximate height for profile + username + timestamp

            // Measure hook lines for vertical centering
            const textMaxWidth = canvasWidth - padding * 2;
            const lineHeight = 36; // Increased for spacing
            ctx.font = 'bold 28px Chirp, "Noto Color Emoji"'; // Larger bold font for readability, no faint text
            const lines = wrapTextMeasure(ctx, hook, textMaxWidth, lineHeight);
            const textHeight = lines.length * lineHeight;

            // Calculate vertical start for the entire content block
            const totalContentHeight = headerHeight + textHeight + padding; // Margins
            const contentY = (canvasHeight - totalContentHeight) / 2;

            // Draw profile pic (circular)
            const profileRadius = 24;
            const profileX = padding;
            const profileY = contentY;
            if (automation.profileImageUrl) {
              console.log('Attempting to load profile image from:', automation.profileImageUrl);
              try {
                const profileImg = await loadImage(automation.profileImageUrl);
                ctx.save();
                ctx.beginPath();
                ctx.arc(profileX + profileRadius, profileY + profileRadius, profileRadius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(profileImg, profileX, profileY, profileRadius * 2, profileRadius * 2);
                ctx.restore();
                console.log('Drew profile image');
              } catch (imgError) {
                console.error(`Failed to load or draw profile image for automation ${automation._id}:`, imgError);
              }
            } else {
              console.log('No profileImageUrl provided');
            }

            // Draw username and handle
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Chirp';
            const usernameX = profileX + profileRadius * 2 + 10;
            ctx.fillText(automation.username || 'User', usernameX, profileY + 20);
            ctx.fillStyle = '#8b98a5';
            ctx.font = '14px Chirp';
            ctx.fillText(`@${automation.username?.toLowerCase().replace(/\s/g, '') || 'user'}`, usernameX, profileY + 40);
            console.log('Drew username and handle');

            // Draw timestamp next to handle, aligned
            ctx.fillStyle = '#8b98a5';
            ctx.font = '14px Chirp';
            const timestamp = '· ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) + ' · Dec 9, 2025';
            const handleWidth = ctx.measureText(`@${automation.username?.toLowerCase().replace(/\s/g, '') || 'user'}`).width;
            ctx.fillText(timestamp, usernameX + handleWidth + 10, profileY + 40);
            console.log('Drew timestamp');

            // Draw hook with left alignment, proper spacing
            const textY = profileY + headerHeight + padding / 2; // Adjusted space below header
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Chirp, "Noto Color Emoji"'; // Bold to avoid faint
            wrapTextDraw(ctx, lines, profileX, textY, lineHeight);
            console.log('Drew hook text');

            // Get image buffer
            const imageBuffer = canvas.toBuffer('image/png');
            console.log(`Image buffer created, length: ${imageBuffer.length}`);
            base64Image = imageBuffer.toString('base64');
            console.log(`base64Image generated, length: ${base64Image.length}`);
          } else {
            console.log('automateImages is false, skipping image generation');
          }

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

          console.log(`Preparing to post with media: ${!!base64Image}`);
          const postRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/social/post`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              platform: account.platform,
              accountId: account._id,
              content,
              media: base64Image ? `data:image/png;base64,${base64Image}` : null,
              mediaType: 'image/png'
            })
          });

          const postResText = await postRes.text();
          console.log(`Post response status: ${postRes.status}, body: ${postResText}`);

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
        automation.nextRun = calculateNextRun(automation.postTime);
        await automation.save();
        console.log(`Updated automation ${automation._id}`);
      } else {
        console.log(`Post failed for automation ${automation._id}`);
      }
    }

    return NextResponse.json({ message: "Automations processed successfully" });
  } catch (error) {
    console.error("Error running automations:", error);
    return NextResponse.json({ error: "Failed to run automations" }, { status: 500 });
  }
}

// Helper: Calculate next run
function calculateNextRun(postTime: string): Date {
  const [hours, minutes] = postTime.split(':').map(Number);
  const now = new Date();
  const next = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0, 0);
  if (next < now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

// Helper: Measure wrapped text lines
function wrapTextMeasure(ctx: any, text: string, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

// Helper: Draw wrapped text lines (left aligned)
function wrapTextDraw(ctx: any, lines: string[], x: number, y: number, lineHeight: number) {
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
}