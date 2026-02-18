import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SchedulerPost } from "./types";
import DraggablePost from "./DraggablePost";
import { Plus, Sparkles, ChevronLeft, ChevronRight, Calendar as CalendarIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import AutoIdeaButton from "./AutoIdeaButton";
import AutoIdeaModal, { AutoIdeaInput } from "./AutoIdeaModal";
import { addMonths, subMonths, format } from "date-fns";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface DraftsSidebarProps {
    drafts: SchedulerPost[];
    posts: SchedulerPost[];
    onUpdatePosts: (posts: SchedulerPost[]) => void;
    onCreateDraft: () => void;

    id?: string;
    onDraftClick?: (post: SchedulerPost) => void;
}

export default function DraftsSidebar({
    drafts,
    posts,
    onUpdatePosts,
    onCreateDraft,
    onDraftClick,
    id = "drafts-sidebar"
}: DraftsSidebarProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { type: "drafts" },
    });

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);

    const handleGenerateIdeas = async (input: AutoIdeaInput) => {
        try {
            const res = await fetch("/api/ai/generate-ideas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input)
            });

            if (!res.ok) throw new Error("Failed to generate");

            const generatedIdeas: any[] = await res.json();

            const newPosts: SchedulerPost[] = generatedIdeas.map((idea: any) => ({
                _id: Math.random().toString(36).substr(2, 9),
                content: idea.content,
                platform: idea.platform,
                scheduledAt: new Date(idea.scheduledAt),
                isDraft: false,
                media: null,
                mediaType: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: "temp",
                linkedinId: "temp"
            } as unknown as SchedulerPost));

            onUpdatePosts([...posts, ...newPosts]);
            toast.success(`Generated ${newPosts.length} ideas!`);

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate ideas");
        }
    };

    if (isCollapsed) {
        return (
            <div
                className="w-12 border-l border-border bg-card/50 flex flex-col h-full transition-all duration-300 backdrop-blur-3xl relative items-center py-4"
            >
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
            <div className="p-4 border-b border-border flex flex-col gap-4 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20">
                            <Sparkles size={16} className="text-primary" />
                        </div>
                        <h3 className="font-bold text-foreground tracking-tight">Ideas</h3>
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


            </div>

            {/* Controls */}
            <div className="p-3 px-4 flex justify-between items-center gap-2">
                <AutoIdeaButton onClick={() => setIsAutoModalOpen(true)} />
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
                        <p className="text-sm font-medium text-muted-foreground mb-1">Empty</p>
                        <p className="text-xs text-muted-foreground/60">Drag posts here.</p>
                    </div>
                )}

                {drafts.map((draft) => (
                    <DraggablePost key={draft._id} post={draft} onClick={onDraftClick} />
                ))}
            </div>

            <AutoIdeaModal
                isOpen={isAutoModalOpen}
                onClose={() => setIsAutoModalOpen(false)}
                onGenerate={handleGenerateIdeas}
            />
        </div>
    );
}
