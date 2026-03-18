import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";
import ScheduledPost from "@/models/ScheduledPost";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const PRESET_STYLES: Record<string, string> = {
  "thought-leadership": "Open with a bold contrarian statement that challenges the status quo. Back it with sharp logic and lived analogy. End with a forward-looking insight that makes people want to save and share.",
  "quick-tips": "Create a punchy numbered list of 5-7 instantly actionable tips. Start each with a strong action verb. One sentence of explanation per tip. Make each tip feel like it was hard-won knowledge.",
  "personal-story": "Use a fictional analogy character (e.g. 'Take Marcus, a founder who…'). Show a real struggle, a turning point, and a clear lesson. Make the reader feel like they lived it.",
  "controversial-take": "Open directly with the controversial opinion — no warm-up. Support with 2-3 sharp logical points. Invite respectful debate at the end.",
  "case-study": "Structure: Problem → What They Did Differently → Measurable Result. Use a fictional character to tell it. Include a real-feeling number.",
  "question-hook": "Open with a question that stops people mid-scroll. Make it specific and a little uncomfortable. Answer it with depth and a twist they didn't expect.",
  "list-post": "Format as a scannable numbered list. Each point delivers standalone value. Start with the most powerful point. Use parallel sentence structure throughout.",
  "behind-scenes": "Pull back the curtain on something that usually stays hidden. Be specific about the messy reality. Use short, punchy sentences. Make the reader feel like an insider.",
};

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    const {
      topics,
      frequency,
      tone = "Professional",
      platform = "LinkedIn",
      startDate,
      accountId,
      preset,
      length = "medium",
      generateImage = false,
    } = await req.json();

    // --- Resolve real LinkedIn member ID ---
    let resolvedLinkedinId = "unknown";
    if (accountId) {
      const account = await SocialAccount.findById(accountId);
      if (account?.linkedinId) {
        resolvedLinkedinId = account.linkedinId;
      }
    }
    if (resolvedLinkedinId === "unknown" && session?.user?.id) {
      const account = await SocialAccount.findOne({
        userId: session.user.id,
        platform: { $regex: /linkedin/i },
        connected: true,
      });
      if (account?.linkedinId) resolvedLinkedinId = account.linkedinId;
    }

    // --- Post count from frequency ---
    let postCount = 12;
    let freqText = frequency;
    if (frequency === "daily") { postCount = 28; freqText = "every day (7x/week)"; }
    else if (frequency === "weekdays") { postCount = 20; freqText = "weekdays only (Mon-Fri)"; }
    else if (frequency === "3_times_week") { postCount = 12; freqText = "3 times per week"; }
    else if (frequency === "weekly") { postCount = 4; freqText = "once per week"; }
    else if (!isNaN(Number(frequency))) {
      postCount = Number(frequency) * 4;
      freqText = `${frequency} times per week`;
    }

    // --- Length instruction ---
    const lengthMap = {
      short: "50-120 words — punchy, direct, zero fluff. Every word earns its place.",
      medium: "150-250 words — balanced depth. Clear structure, strong hook, one big idea per post.",
      long: "280-400 words — rich storytelling. Build tension, deliver insight, end with a strong CTA.",
    };
    const lengthInstruction = lengthMap[length as keyof typeof lengthMap] || lengthMap.medium;

    // --- Preset style ---
    const presetInstruction = preset && PRESET_STYLES[preset]
      ? `\nCONTENT STYLE TO USE: ${PRESET_STYLES[preset]}`
      : "";

    // --- Platform-specific rules ---
    const platformRules: Record<string, string> = {
      LinkedIn: `- Open with a single bold line that stops the scroll (no "I", no clichés)
- Short paragraphs — max 2 sentences, blank line between each
- Build to one clear insight or lesson
- Close with a comment-provoking question or CTA
- Tone: confident, human, valuable`,
      Twitter: `- Thread format if over 280 chars — number each tweet
- Hook must create instant curiosity in the first tweet
- Each tweet must stand alone AND pull into the next
- Punchy, contrarian, high-signal`,
      Instagram: `- Emotional hook in the first line
- Strategic line breaks for mobile
- 3-5 hashtags at the end
- End with an engagement question`,
      Facebook: `- Warm, conversational, community-focused
- Storytelling that invites comments
- Ask a question that sparks discussion`,
    };

    const platformKey = platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
    const platformGuide = platformRules[platformKey] || platformRules.LinkedIn;

    const now = new Date();
    const dateRef = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const prompt = `You are a world-class social media ghostwriter. Your posts go viral consistently because they combine sharp hooks, emotional storytelling, and real insight.

Generate EXACTLY ${postCount} complete, ready-to-publish ${platformKey} posts for a 4-week content calendar.

STRATEGY:
- Topic(s): ${topics}
- Tone: ${tone}
- Frequency: ${freqText}
- Start date: ${startDate}
- Post length: ${lengthInstruction}
${presetInstruction}

PLATFORM RULES for ${platformKey}:
${platformGuide}

HOOK FORMULAS (rotate through these):
1. Contrarian opener: "Most people get [X] completely wrong."
2. Story drop: "Take [Name], a [role] who [situation]…"
3. Bold claim: "[Surprising claim]. Here's why."
4. Question bomb: "What separates [A] from [B]? One decision."
5. Number hook: "[#] things [outcome] never do."
6. Pattern interrupt: "Stop [common thing]. Start [better thing]."

STORYTELLING RULES:
- Use ONLY fictional analogy characters — never "I" or "a friend of mine"
- Character names should feel real: "Take Mia, a product manager…" / "Meet Kofi, who ran a 7-figure brand…"
- Show: struggle → insight → shift → lesson
- Include emotional tension and a satisfying payoff

QUALITY BAR — Every post must have:
✓ A scroll-stopping first line
✓ One clear, specific idea (not a listicle of vague advice)
✓ Concrete detail (name, number, or situation)
✓ Natural line breaks for readability
✓ A strong close (question, takeaway, or CTA)

HARD RULES:
- NO asterisks, NO markdown bold/italic, NO hashtag spam
- NO corporate buzzwords (synergy, leverage, disrupt)
- NO starting with "I" or "We"
- NO ending with "Let me know your thoughts"
- Emojis: 0-3 max, only where they genuinely add tone
- Vary the structure across all ${postCount} posts

SCHEDULE LOGIC:
- Spread posts evenly across 4 weeks starting ${startDate}
- Use optimal posting times: 7:30, 8:00, 12:00, 12:30, 17:00, 17:30 (rotate)
- Date format: YYYY-MM-DD, Time format: HH:MM

Today's date for freshness reference: ${dateRef}

OUTPUT: Return ONLY a valid JSON array — no markdown, no explanation, nothing else.
[
  {"content": "full post text here", "date": "YYYY-MM-DD", "time": "HH:MM"},
  ...
]`;

    const generatedText = await generateContent(prompt, { maxTokens: 8192 });

    let text = generatedText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let plan: any[] = [];
    try {
      plan = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try { plan = JSON.parse(match[0]); }
        catch { return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 }); }
      } else {
        return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 });
      }
    }

    const createdPosts = [];
    for (const item of plan) {
      if (!item.date || !item.content) continue;

      const cleanContent = item.content
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/_{2,}/g, "")
        .trim();

      const dateTimeString = `${item.date}T${item.time || "09:00"}:00`;
      const scheduledAt = new Date(dateTimeString);

      const newPost = await ScheduledPost.create({
        linkedinId: resolvedLinkedinId,
        userId: session?.user?.id,
        content: cleanContent,
        scheduledAt,
        posted: false,
        isDraft: false,
        platform: platform.toLowerCase(),
        generateImage,
      });
      createdPosts.push(newPost);
    }

    return NextResponse.json({ success: true, count: createdPosts.length, posts: createdPosts });
  } catch (error) {
    console.error("Schedule generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Error" },
      { status: 500 }
    );
  }
}
