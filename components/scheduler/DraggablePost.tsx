import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { SchedulerPost } from "./types";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, Video, MoreHorizontal } from "lucide-react";

interface DraggablePostProps {
    post: SchedulerPost;
    isOverlay?: boolean;
    onClick?: (post: SchedulerPost) => void;
}

export default function DraggablePost({ post, isOverlay, onClick }: DraggablePostProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: post._id,
        data: { post, type: "POST" },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    if (isDragging && !isOverlay) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-blue-500/20 rounded-lg border border-blue-500/30 h-10 w-full animate-pulse"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick?.(post)}
            className={`
        group relative flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing
        ${isOverlay
                    ? "z-50 bg-card border-primary shadow-2xl scale-105 rotate-1 backdrop-blur-xl ring-2 ring-primary/20"
                    : "bg-card border-border hover:bg-accent/50 hover:border-muted-foreground/30 hover:shadow-sm"
                }
      `}
        >
            <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
                <GripVertical size={14} />
            </div>

            {/* Platform Indicator */}
            <div className={`
        w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,119,181,0.4)]
        ${post.platform === "linkedin" ? "bg-[#0077b5]" : "bg-sky-400"}
      `} />

            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 font-medium truncate group-hover:text-white transition-colors">
                    {post.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500">{post.platform || 'LinkedIn'}</span>
                </div>
            </div>

            {post.media && post.mediaType === 'image' && (
                <div className="h-8 w-8 rounded bg-cover bg-center border border-white/10 shrink-0" style={{ backgroundImage: `url(${post.media})` }} />
            )}

            {post.media && post.mediaType === 'video' && (
                <div className="h-8 w-8 rounded bg-slate-800 border border-white/10 shrink-0 flex items-center justify-center">
                    <Video size={12} className="text-slate-400" />
                </div>
            )}

            <button className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded ml-1">
                <MoreHorizontal size={14} />
            </button>
        </div>
    );
}
