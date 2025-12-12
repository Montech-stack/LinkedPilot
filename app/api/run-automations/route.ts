// File: /app/api/run-automations/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Automation from "@/models/Automation";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { generateContent } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import * as cheerio from "cheerio";
import fs from "fs";

// Canvas imports wrapped in try/catch for build safety
let createCanvas: any, loadImage: any, registerFont: any;
try {
  const canvasModule = await import("canvas");
  createCanvas = canvasModule.createCanvas;
  loadImage = canvasModule.loadImage;
  registerFont = canvasModule.registerFont;
} catch (err) {
  console.warn("Canvas module not available:", err);
}

// ==========================================
// GET handler: run automations
// ==========================================
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = req.headers.get("x-cron-secret");
    const isCron =
      authHeader === `Bearer ${process.env.VERCEL_CRON_SECRET}` ||
      cronSecret === process.env.VERCEL_CRON_SECRET;

    let userId: string | undefined;
    if (!isCron) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.user.id;
    }

    await connectToDatabase();
    const now = new Date();

    // Fetch due content automations
    const query: any = { type: "content", isActive: true, ...(isCron ? {} : { userId }) };
    const dueAutomations = await Automation.find(query);

    for (const automation of dueAutomations) {
      // --- Fetch trending topics ---
      let trends: string[] = [];
      try {
        const trendsResponse = await fetch("https://getdaytrends.com/");
        const trendsHtml = await trendsResponse.text();
        const $ = cheerio.load(trendsHtml);
        $("ol.trend-card__list li a").each((i, el) => {
          if (i < 5) trends.push($(el).text().trim());
        });
      } catch (err) {
        console.warn("Failed to fetch trends:", err);
      }

      const trendsClause = trends.length
        ? `Incorporate one or more of these trending topics only if naturally relevant: ${trends.join(", ")}.`
        : "";

      const uniquenessClause = `Ensure originality by using analogy-style examples instead of personal claims. For example: "Take Mr. Scofield — he tried X, then Y…". Avoid clichés, overused inspirational phrases, and generic AI structures.`;

      // --- Build prompt ---
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
Use analogy storytelling instead of personal stories.  
${trendsClause}
${uniquenessClause}

Each post must:
- Start with a strong curiosity, contrarian, or number-based hook.
- Include 2-4 actionable points starting with a hyphen.
- Use 3-8 strategically placed emojis.
- End with a strong question or call to comment.
- Add 3-5 niche-relevant hashtags.
- Keep paragraphs short and conversational.
- Avoid markdown, promotional language, and corporate jargon.

Return ONLY a JSON array of ${count} objects:
[
  {
    "id": "number-index",
    "content": "full post text",
    "hook": "opening hook only"
  }
]
`;

      // --- Generate content ---
      const generatedContent = await generateContent(prompt, { maxTokens: 3000 });
      let cleanedContent = generatedContent.replace(/```json\n|\n```|```/g, "").trim();

      let posts: any[];
      try {
        posts = JSON.parse(cleanedContent);
      } catch {
        posts = [{ content: `Generated post for "${idea}".`, hook: idea }];
      }

      const content = posts[0]?.content || "";
      const hook = posts[0]?.hook || content.split(".")[0].trim() + ".";
      if (!content) continue;

      // --- Post to accounts ---
      let postSuccess = true;
      for (const accountId of automation.selectedAccounts) {
        const account = await SocialAccount.findById(accountId);
        if (!account?.connected) continue;

        let base64Image: string | null = null;
        if (automation.automateImages && createCanvas) {
          fs.mkdirSync("/tmp", { recursive: true });

          // Fonts
          const tmpChirpFont = "/tmp/Chirp-Regular.ttf";
          const tmpEmojiFont = "/tmp/NotoColorEmoji.ttf";

          if (!fs.existsSync(tmpChirpFont)) {
            const res = await fetch("https://abs.twimg.com/fonts/v1/chirp-regular.woff");
            if (res.ok) fs.writeFileSync(tmpChirpFont, Buffer.from(await res.arrayBuffer()));
          }
          if (!fs.existsSync(tmpEmojiFont)) {
            const res = await fetch("https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf");
            if (res.ok) fs.writeFileSync(tmpEmojiFont, Buffer.from(await res.arrayBuffer()));
          }

          try { registerFont(tmpChirpFont, { family: "Chirp" }); } catch {}
          try { registerFont(tmpEmojiFont, { family: "Noto Color Emoji" }); } catch {}

          const canvas = createCanvas(600, 400);
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#15202b";
          ctx.fillRect(0, 0, 600, 400);

          const padding = 40, headerHeight = 60, lineHeight = 36;
          ctx.font = 'bold 28px Chirp, "Noto Color Emoji"';
          const lines = wrapTextMeasure(ctx, hook, 600 - padding * 2, lineHeight);
          wrapTextDraw(ctx, lines, padding, headerHeight + padding, lineHeight);

          base64Image = canvas.toBuffer("image/png").toString("base64");
        }

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (isCron) headers["x-cron-secret"] = process.env.VERCEL_CRON_SECRET || "";
        else {
          const cookie = req.headers.get("cookie");
          if (cookie) headers["Cookie"] = cookie;
        }

        const postRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/social/post`, {
          method: "POST",
          headers,
          body: JSON.stringify({ platform: account.platform, accountId: account._id, content, media: base64Image ? `data:image/png;base64,${base64Image}` : null, mediaType: "image/png" })
        });

        if (!postRes.ok) postSuccess = false;
      }

      if (postSuccess) {
        automation.lastRun = now;
        automation.count += 1;
        automation.nextRun = calculateNextRun(automation.postTime);
        await automation.save();
      }
    }

    return NextResponse.json({ message: "Automations processed successfully" });
  } catch (error: any) {
    console.error("Error running automations:", error);
    return NextResponse.json({ error: "Failed to run automations" }, { status: 500 });
  }
}

// ==========================================
// Helpers
// ==========================================
function calculateNextRun(postTime: string) {
  const [hours, minutes] = postTime.split(":").map(Number);
  const now = new Date();
  const next = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0, 0);
  if (next < now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function wrapTextMeasure(ctx: any, text: string, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else line = testLine;
  }
  lines.push(line.trim());
  return lines;
}

function wrapTextDraw(ctx: any, lines: string[], x: number, y: number, lineHeight: number) {
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
}
