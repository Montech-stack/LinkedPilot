
import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { SchedulerPost } from "./types";
import { addDays, isWeekend, setHours, setMinutes, startOfToday, isBefore } from "date-fns";
import toast from "react-hot-toast";

interface SmartScheduleButtonProps {
    posts: SchedulerPost[];
    drafts: SchedulerPost[];
    onUpdatePosts: (updatedPosts: SchedulerPost[]) => void;
}

export default function SmartScheduleButton({ posts, drafts, onUpdatePosts }: SmartScheduleButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAutoFill = async () => {
        if (drafts.length === 0) {
            toast.error("No drafts to schedule!");
            return;
        }

        setIsProcessing(true);

        // Simulate AI thinking time
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simple "AI" Algorithm:
        // 1. Start from tomorrow.
        // 2. Skip weekends.
        // 3. Find slots at 10:00 AM or 2:00 PM that are empty.

        let currentDate = addDays(startOfToday(), 1);
        let scheduledCount = 0;
        const newPosts = [...posts]; // Clone existing scheduled posts
        const updatedDrafts: SchedulerPost[] = [];

        // Map of date string to count of posts
        const postsByDate: Record<string, number> = {};
        posts.forEach(p => {
            if (!p.isDraft && p.scheduledAt) {
                const dateKey = new Date(p.scheduledAt).toDateString();
                postsByDate[dateKey] = (postsByDate[dateKey] || 0) + 1;
            }
        });

        for (const draft of drafts) {
            // Find next available slot
            let foundSlot = false;
            let attempts = 0;

            while (!foundSlot && attempts < 30) { // Look ahead 30 days max
                if (isWeekend(currentDate)) {
                    currentDate = addDays(currentDate, 1);
                    continue;
                }

                const dateKey = currentDate.toDateString();
                const currentCount = postsByDate[dateKey] || 0;

                if (currentCount < 2) { // Max 2 posts per day strategy
                    // Schedule here
                    let slotTime = setHours(setMinutes(currentDate, 0), 10); // Default 10 AM
                    if (currentCount === 1) {
                        slotTime = setHours(setMinutes(currentDate, 0), 14); // 2 PM for second post
                    }

                    updatedDrafts.push({
                        ...draft,
                        isDraft: false,
                        scheduledAt: slotTime
                    });

                    // Update tracker
                    postsByDate[dateKey] = currentCount + 1;
                    scheduledCount++;
                    foundSlot = true;
                } else {
                    // Day full, move to next
                    currentDate = addDays(currentDate, 1);
                }
                attempts++;
            }
        }

        if (scheduledCount > 0) {
            // Merge updates
            const allPosts = [
                ...newPosts.filter(p => !updatedDrafts.find(d => d._id === p._id)), // Remove old drafts from list
                ...updatedDrafts
            ];

            onUpdatePosts(allPosts);
            toast.success(`AI scheduled ${scheduledCount} posts!`);

            // Sync to backend (batch update or fire-and-forget loop)
            updatedDrafts.forEach(p => {
                fetch("/api/schedule", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: p._id, isDraft: false, scheduledAt: p.scheduledAt })
                });
            });

        } else {
            toast("No suitable slots found in next 30 days.");
        }

        setIsProcessing(false);
    };

    return (
        <button
            onClick={handleAutoFill}
            disabled={isProcessing || drafts.length === 0}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
        bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20
        hover:shadow-indigo-500/40 hover:scale-105 transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            {isProcessing ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <Sparkles size={14} />
            )}
            {isProcessing ? "Optimizing..." : "Auto-Fill"}
        </button>
    );
}
