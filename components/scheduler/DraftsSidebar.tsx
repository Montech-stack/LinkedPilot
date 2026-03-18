import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SchedulerPost } from "./types";
import DraggablePost from "./DraggablePost";
import { Plus, Wand2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraftsSidebarProps {
  drafts: SchedulerPost[];
  posts: SchedulerPost[];
  onUpdatePosts: (posts: SchedulerPost[]) => void;
  onCreateDraft: () => void;
  onAutoSchedule: () => void;
  id?: string;
  onDraftClick?: (post: SchedulerPost) => void;
}

export default function DraftsSidebar({
  drafts,
  posts,
  onUpdatePosts,
  onCreateDraft,
  onDraftClick,
  onAutoSchedule,
  id = "drafts-sidebar",
}: DraftsSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "drafts" },
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-border bg-card/50 flex flex-col h-full transition-all duration-300 backdrop-blur-3xl relative items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelLeftOpen size={20} />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        w-80 border-l border-border bg-card/50 flex flex-col h-full transition-all duration-300 backdrop-blur-3xl relative
        ${isOver ? "bg-accent/20 shadow-[inset_10px_0_30px_rgba(37,99,235,0.05)]" : ""}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20">
            <Wand2 size={16} className="text-primary" />
          </div>
          <h3 className="font-bold text-foreground tracking-tight">Drafts</h3>
          {drafts.length > 0 && (
            <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {drafts.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <PanelLeftClose size={16} />
        </Button>
      </div>

      {/* Controls */}
      <div className="p-3 px-4 flex justify-between items-center gap-2">
        <button
          onClick={onAutoSchedule}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white hover:from-violet-600 hover:to-indigo-600 transition-all"
        >
          <Wand2 size={13} />
          AI Generate
        </button>
        <button
          onClick={onCreateDraft}
          className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-border"
          title="New Draft"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 relative z-10 custom-scrollbar">
        {drafts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4 border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
            <Wand2 size={24} className="mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No drafts</p>
            <p className="text-xs text-muted-foreground/60">
              Use <span className="text-primary font-medium">Generate Posts</span> or drag posts here.
            </p>
          </div>
        )}

        {drafts.map(draft => (
          <DraggablePost key={draft._id} post={draft} onClick={onDraftClick} />
        ))}
      </div>
    </div>
  );
}
