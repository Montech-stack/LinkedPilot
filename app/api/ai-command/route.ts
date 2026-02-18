import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an AI command parser for Maxis (Maxis Nexus), a social media management platform. Your job is to parse user commands into structured JSON actions to fully automate the application.

AVAILABLE INTENTS:

--- CORE POSTING ---
1. "generate_post" — Generate social media post(s)
   Params: topic (string), platforms (string[], default ["LinkedIn"]), length ("short"|"medium"|"long", default "medium"), count (number, default 1)

2. "schedule_post" — Schedule content for a future time
   Params: content (string), scheduledAt (ISO date string), linkedinId (string, optional)

3. "create_automation" — Set up recurring automated posting
   Params: title (string), topic (string), postTime (HH:mm string), frequency ("daily"|"weekdays"|"weekly"|"custom", default "daily"), tone (string, default "professional"), length ("short"|"medium"|"long", default "medium")

4. "toggle_automation" — Enable/disable automations
   Params: action ("enable"|"disable"|"toggle"), target ("all"|automationId which you might have in context)

--- NAVIGATION & ANALYTICS ---
5. "navigate" — Navigate to a page
   Params: page ("dashboard"|"scheduled"|"automations"|"analytics"|"posts"|"settings"|"engagement"|"writingdna"|"billing"|"beta")

6. "show_stats" — Show a summary of user stats/analytics
   Params: period ("today"|"week"|"month", default "week")

--- SETTINGS & PROFILE ---
7. "update_profile" — Update user profile details
   Params: field ("name"|"email"|"bio"|"jobTitle"), value (string)

8. "update_password" — Initiate password change
   Params: none (triggers a modal or flow)

9. "toggle_notification" — Manage notifications
   Params: type ("email"|"push"|"marketing"), enabled (boolean)

--- BILLING & PLANS ---
10. "subscribe_plan" — Upgrade or change subscription plan
    Params: plan ("pro"|"agency"|"starter")

11. "cancel_plan" — Cancel current subscription
    Params: reason (string, optional)

12. "view_invoices" — View billing history
    Params: none

--- WRITING DNA (VOICE) ---
13. "analyze_voice" — triggered voice analysis simulation
    Params: text (string, optional sample text)

14. "reset_voice" — Reset voice profile to default
    Params: none

--- ENGAGEMENT ---
15. "reply_comment" — Reply to comments
    Params: commentId (string, optional), content (string), sentiment ("positive"|"neutral"|"professional")

16. "view_comments" — View recent comments
    Params: filter ("unread"|"all")

--- BETA FEATURES ---
17. "explore_beta" — List or explore beta features
    Params: feature ("image_gen"|"agent"|"hashtags"|"calendar")

18. "request_access" — Request access to a beta feature
    Params: feature (string)

--- HELP ---
19. "create_preset" — Create a content preset
   Params: name (string), description (string), promptSnippet (string), category (string)

20. "help" — User needs help or command is unclear
   Params: suggestion (string)

RULES:
- Always return valid JSON with: intent, params, confirmation (friendly message confirming what you'll do)
- For time references like "tomorrow at 9am", calculate the actual ISO date based on the current time provided
- Keep confirmation messages short, friendly, and action-oriented ("Upgrading you to Pro!", "Analyzing your writing style now...")
- If the command is ambiguous, use intent "help"
- NEVER return anything other than a JSON object`;

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { message, context } = await request.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const now = new Date();
        const prompt = `${SYSTEM_PROMPT}

CURRENT CONTEXT:
- Current date/time: ${now.toISOString()}
- Current page: ${context?.currentPage || "unknown"}
- User timezone offset: ${context?.timezoneOffset || 0} minutes

USER COMMAND: "${message}"

Return only a JSON object with keys: intent, params, confirmation. No markdown, no code fences, no explanation.`;

        const raw = await generateContent(prompt, {
            maxTokens: 500,
            temperature: 0.3,
        });

        // Parse the JSON response
        let parsed;
        try {
            let cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
            // Try to extract JSON object if wrapped in other text
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleaned = jsonMatch[0];
            }
            parsed = JSON.parse(cleaned);
        } catch {
            return NextResponse.json({
                intent: "help",
                params: {
                    suggestion:
                        "I didn't quite understand that. Try something like: 'Write a post about AI trends' or 'Schedule a post for tomorrow at 9am'",
                },
                confirmation:
                    "I had trouble understanding your command. Here are some things I can do:",
            });
        }

        // Validate the response has required fields
        if (!parsed.intent || !parsed.params) {
            return NextResponse.json({
                intent: "help",
                params: {
                    suggestion: "Try a more specific command like 'Generate 3 LinkedIn posts about leadership'",
                },
                confirmation: "I need a bit more detail to help you.",
            });
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("AI Command error:", error);
        return NextResponse.json(
            { error: "Failed to process command" },
            { status: 500 }
        );
    }
}
