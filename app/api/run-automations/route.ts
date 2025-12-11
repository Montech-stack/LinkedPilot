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
    const authHeader = req.headers.get("authorization");
    const cronSecret = req.headers.get("x-cron-secret");
    const isCron =
      authHeader === `Bearer ${process.env.VERCEL_CRON_SECRET}` ||
      cronSecret === process.env.VERCEL_CRON_SECRET;

    let userId;
    if (!isCron) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    await connectToDatabase();
    const now = new Date();

    const query = {
      type: "content",
      isActive: true,
      ...(isCron ? {} : { userId })
    };

    const dueAutomations = await Automation.find(query);

    for (const automation of dueAutomations) {
      let trends = [];
      try {
        const trendsResponse = await fetch("https://getdaytrends.com/");
        const trendsHtml = await trendsResponse.text();
        const $ = cheerio.load(trendsHtml);

        $("ol.trend-card__list li a").each((i, el) => {
          if (i < 5) {
            trends.push($(el).text().trim());
          }
        });
      } catch (err) {}

      const trendsClause =
        trends.length > 0
          ? `Incorporate one or more of these trending topics only if naturally relevant: ${trends.join(
              ", "
            )}.`
          : "";

      const uniquenessClause = `Ensure originality by using analogy-style examples instead of personal claims. For example: "Take Mr. Scofield—he tried X, then Y…". Do NOT use fake personal stories or pretend the writer experienced things. Avoid clichés, overused inspirational phrases, or generic AI structures.`;

      const { topic: idea, tone, length } = automation;
      const count = 1;
      const wordCount =
        length === "short"
          ? "50-100 words"
          : length === "medium"
          ? "100-200 words"
          : "200-300 words";

      const prompt = `
Generate ${count} original, highly engaging LinkedIn post(s) using a ${tone} tone based on the idea: "${idea}".  
Use analogy storytelling instead of personal stories. For example:  
"Take Mr. Scofield — he tried A, then B… what happened next changed everything."  
No fake personal experiences. No pretending the author lived the story.

${trendsClause}
${uniquenessClause}

STYLE & STRUCTURE REQUIREMENTS:

1. HOOK  
   The first line must be a strong curiosity, contrarian, or number-based hook.

2. ANALOGY STORY  
   Include a short analogy-based anecdote (NOT personal):  
   - Use characters like “Mr. Scofield”, “Jordan”, “Maya”, “the founder who…”, etc.  
   - Keep it 2–4 sentences max.  
   - Make it relatable and almost metaphor-like.

3. ACTIONABLE VALUE  
   Provide **2–4 action points**, each starting with a **hyphen**:  
   - Make the points simple, practical, and easy to skim.  
   - No numbers.  
   - No asterisks.  
   - No long paragraphs.

4. EMOJIS  
   Use **3–8 emojis**, placed strategically (not spammy).

5. CTA  
   End with a strong question or call to comment.

6. HASHTAGS  
   Add **3–5 short, niche-relevant hashtags** at the end.

7. FORMAT  
   - Keep paragraphs short for LinkedIn.  
   - Avoid promotional language.  
   - Avoid corporate jargon unless needed by topic.  
   - Maintain conversational, relatable tone.  
   - Avoid all forms of markdown (no *, no **, no ###).  
   - Output must be plain text.

RETURN STRUCTURE (IMPORTANT):

Return ONLY a JSON array of ${count} objects:

[
  {
    "id": "number-index",
    "content": "full post text",
    "hook": "opening hook only"
  }
]

Do not output anything else outside the JSON.
`;

      const generatedContent = await generateContent(prompt, {
        maxTokens: 3000
      });

      let cleanedContent = generatedContent
        .replace(/```json\n|\n```/g, "")
        .replace(/```/g, "")
        .trim();

      let posts;
      try {
        posts = JSON.parse(cleanedContent);
      } catch (err) {
        posts = [
          {
            content: `Generated post for "${idea}".`,
            hook: idea
          }
        ];
      }

      const content =
        posts[0]?.content?.replace(/\*/g, "") || "";
      const hook =
        posts[0]?.hook ||
        content.split(".")[0].trim() + ".";

      if (!content) continue;

      let postSuccess = true;

      for (const accountId of automation.selectedAccounts) {
        const account = await SocialAccount.findById(accountId);
        if (!account?.connected) continue;

        let base64Image: string | null = null;

        if (automation.automateImages) {
          fs.mkdirSync("/tmp", { recursive: true });

          const tmpChirpFontPath = "/tmp/Chirp-Regular.ttf";
          const tmpEmojiFontPath = "/tmp/NotoColorEmoji.ttf";

          if (!fs.existsSync(tmpChirpFontPath)) {
            const chirpFontRes = await fetch(
              "https://abs.twimg.com/fonts/v1/chirp-regular.woff"
            );
            if (chirpFontRes.ok) {
              const buf = Buffer.from(
                await chirpFontRes.arrayBuffer()
              );
              fs.writeFileSync(tmpChirpFontPath, buf);
            }
          }

          if (!fs.existsSync(tmpEmojiFontPath)) {
            const emojiFontRes = await fetch(
              "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf"
            );
            if (emojiFontRes.ok) {
              const buf = Buffer.from(
                await emojiFontRes.arrayBuffer()
              );
              fs.writeFileSync(tmpEmojiFontPath, buf);
            }
          }

          registerFont(tmpChirpFontPath, { family: "Chirp" });
          registerFont(tmpEmojiFontPath, {
            family: "Noto Color Emoji"
          });

          const canvasWidth = 600;
          const canvasHeight = 400;
          const canvas = createCanvas(canvasWidth, canvasHeight);
          const ctx = canvas.getContext("2d");

          ctx.fillStyle = "#15202b";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          const padding = 40;
          const headerHeight = 60;
          const textMaxWidth = canvasWidth - padding * 2;
          const lineHeight = 36;

          ctx.font = 'bold 28px Chirp, "Noto Color Emoji"';
          const lines = wrapTextMeasure(
            ctx,
            hook,
            textMaxWidth,
            lineHeight
          );
          const textHeight = lines.length * lineHeight;

          const totalContentHeight =
            headerHeight + textHeight + padding;
          const contentY =
            (canvasHeight - totalContentHeight) / 2;

          const profileRadius = 24;
          const profileX = padding;
          const profileY = contentY;

          if (automation.profileImageUrl) {
            try {
              const profileImg = await loadImage(
                automation.profileImageUrl
              );
              ctx.save();
              ctx.beginPath();
              ctx.arc(
                profileX + profileRadius,
                profileY + profileRadius,
                profileRadius,
                0,
                Math.PI * 2
              );
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(
                profileImg,
                profileX,
                profileY,
                profileRadius * 2,
                profileRadius * 2
              );
              ctx.restore();
            } catch {}
          }

          ctx.fillStyle = "white";
          ctx.font = "bold 16px Chirp";
          const usernameX = profileX + profileRadius * 2 + 10;
          ctx.fillText(
            automation.username || "User",
            usernameX,
            profileY + 20
          );

          ctx.fillStyle = "#8b98a5";
          ctx.font = "14px Chirp";
          const handle = `@${
            automation.username?.toLowerCase().replace(/\s/g, "") ||
            "user"
          }`;
          ctx.fillText(handle, usernameX, profileY + 40);

          ctx.fillStyle = "#8b98a5";
          const timestamp =
            "· " +
            now.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true
            }) +
            " · Dec 9, 2025";
          const handleWidth = ctx.measureText(handle).width;
          ctx.fillText(
            timestamp,
            usernameX + handleWidth + 10,
            profileY + 40
          );

          const textY =
            profileY + headerHeight + padding / 2;
          ctx.fillStyle = "white";
          ctx.font = 'bold 28px Chirp, "Noto Color Emoji"';
          wrapTextDraw(ctx, lines, profileX, textY, lineHeight);

          const imageBuffer = canvas.toBuffer("image/png");
          base64Image = imageBuffer.toString("base64");
        }

        const headers: HeadersInit = {
          "Content-Type": "application/json"
        };

        if (isCron) {
          headers["x-cron-secret"] =
            process.env.VERCEL_CRON_SECRET || "";
        } else {
          const cookie = req.headers.get("cookie");
          if (cookie) headers["Cookie"] = cookie;
        }

        const postRes = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/social/post`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              platform: account.platform,
              accountId: account._id,
              content,
              media: base64Image
                ? `data:image/png;base64,${base64Image}`
                : null,
              mediaType: "image/png"
            })
          }
        );

        if (!postRes.ok) postSuccess = false;
      }

      if (postSuccess) {
        automation.lastRun = now;
        automation.count += 1;
        automation.nextRun = calculateNextRun(automation.postTime);
        await automation.save();
      }
    }

    return NextResponse.json({
      message: "Automations processed successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run automations" },
      { status: 500 }
    );
  }
}

// Timing helper
function calculateNextRun(postTime: string): Date {
  const [hours, minutes] = postTime.split(":").map(Number);
  const now = new Date();
  const next = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours,
    minutes,
    0,
    0
  );
  if (next < now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

// Text wrap helpers
function wrapTextMeasure(
  ctx: any,
  text: string,
  maxWidth: number,
  lineHeight: number
): string[] {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }

  lines.push(line.trim());
  return lines;
}

function wrapTextDraw(
  ctx: any,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number
) {
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
}
