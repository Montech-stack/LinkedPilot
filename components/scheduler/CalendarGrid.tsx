import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isWeekend } from "date-fns";
import { SchedulerPost } from "./types";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import DraggablePost from "./DraggablePost";

interface CalendarGridProps {
    currentDate: Date;
    posts: SchedulerPost[];
    onDateClick: (date: Date) => void;
    onPostClick: (post: SchedulerPost) => void;
    showInsights?: boolean;
}

export default function CalendarGrid({ currentDate, posts, onDateClick, onPostClick, showInsights }: CalendarGridProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden shadow-2xl backdrop-blur-3xl relative">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            {/* Scrollable Container for Mobile */}
            <div className="flex-1 overflow-x-auto overflow-y-auto relative z-10 transition-all custom-scrollbar">
                <div className="min-w-[800px] h-full flex flex-col">
                    {/* Header Days */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/20">
                        {weekDays.map((day) => (
                            <div key={day} className="py-2.5 md:py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(100px,_1fr)]">
                        {days.map((day) => (
                            <DayCell
                                key={day.toISOString()}
                                day={day}
                                isCurrentMonth={isSameMonth(day, monthStart)}
                                activeDate={currentDate}
                                posts={posts.filter(p => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day))}
                                onClick={() => onDateClick(day)}
                                onPostClick={onPostClick}
                                showInsights={showInsights}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface DayCellProps {
    day: Date;
    isCurrentMonth: boolean;
    activeDate: Date;
    posts: SchedulerPost[];
    onClick: () => void;
    onPostClick: (post: SchedulerPost) => void;
    showInsights?: boolean;
}

function DayCell({ day, isCurrentMonth, posts, onClick, onPostClick, showInsights }: DayCellProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: day.toISOString(),
        data: { date: day },
    });

    // Mock Heatmap Logic
    const dayOfWeek = day.getDay();
    const engagementScore = (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) ? 'high' : (dayOfWeek === 1 || dayOfWeek === 5) ? 'medium' : 'low';
    const insightColor = showInsights ?
        (engagementScore === 'high' ? 'bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]' :
            engagementScore === 'medium' ? 'bg-amber-500/5' : '')
        : '';


    const isCurrent = isToday(day);

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
                min-h-[120px] p-2 border-r border-b border-border relative transition-all duration-300 group
                ${isCurrentMonth ? "bg-transparent" : "bg-muted/10"}
                ${!isCurrentMonth ? "opacity-50" : "opacity-100"}
                ${isOver ? "bg-primary/5 shadow-[inner_0_0_20px_rgba(59,130,246,0.2)]" : ""}
                ${isCurrent ? "bg-primary/5" : ""}
                ${insightColor}
                hover:bg-accent/50
            `}
        >
            <div className={`
                text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full transition-all
                ${isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground group-hover:text-foreground group-hover:bg-accent"}
            `}>
                {format(day, "d")}
            </div>
            {posts.length > 0 && (
                <div className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    {posts.length}
                </div>
            )}

            <div className="space-y-1.5 relative z-10">
                {posts.map((post) => (
                    <DraggablePost key={post._id} post={post} onClick={onPostClick} />
                ))}
            </div>
        </div>
    );
}
