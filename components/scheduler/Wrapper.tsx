import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Sparkles, LayoutGrid, ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent
} from "@dnd-kit/core";
import { SchedulerPost } from "./types";
import CalendarGrid from "./CalendarGrid";
import DraftsSidebar from "./DraftsSidebar";
import DraggablePost from "./DraggablePost";
import PostEditorModal from "./PostEditorModal";
import AutoIdeaModal, { AutoIdeaInput } from "./AutoIdeaModal";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface SocialAccount {
    _id: string;
    name: string;
    platform: string;
    email: string;
    connected: boolean;
}

export default function SchedulerWrapper() {
    const [posts, setPosts] = useState<SchedulerPost[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    // Editor State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<SchedulerPost | null>(null);
    const [showInsights, setShowInsights] = useState(false);

    // AI Scheduler State (lifted here so it's accessible from the header)
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    useEffect(() => {
        setMounted(true);
        fetchPosts();
        fetchAccounts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/schedule");
            const data = await res.json();
            if (Array.isArray(data)) {
                const mapped: SchedulerPost[] = data.map((p: any) => ({
                    ...p,
                    _id: p._id,
                    scheduledAt: p.scheduledAt ? new Date(p.scheduledAt) : undefined,
                    isDraft: p.isDraft || !p.scheduledAt,
                }));
                setPosts(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
            toast.error("Could not load schedule");
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch("/api/social");
            const data = await res.json();
            if (Array.isArray(data)) {
                setAccounts(data.filter((a: SocialAccount) => a.connected));
            }
        } catch {
            // non-critical
        }
    };

    const handleGeneratePosts = async (input: AutoIdeaInput) => {
        const countMap: Record<string, string> = {
            daily: "28", weekdays: "20", "3_times_week": "12", weekly: "4",
        };
        const toastId = toast.loading(`Generating ${countMap[input.frequency] || "12"} posts…`);
        try {
            const payload = {
                topics: `${input.niche} targeted at ${input.audience}`,
                frequency: input.frequency,
                platform: input.platform,
                startDate: new Date().toISOString().split("T")[0],
                tone: input.tone,
                length: input.length,
                preset: (input.preset && input.preset !== "none") ? input.preset : undefined,
                accountId: input.accountId || undefined,
                generateImage: false,
            };

            const res = await fetch("/api/schedule/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Generation failed");
            const data = await res.json();

            if (data.success && data.posts) {
                const newPosts: SchedulerPost[] = data.posts.map((p: any) => ({
                    ...p,
                    scheduledAt: p.scheduledAt ? new Date(p.scheduledAt) : new Date(),
                    isDraft: false,
                }));
                setPosts(prev => [...prev, ...newPosts]);
                toast.success(`${newPosts.length} posts scheduled!`, { id: toastId });
            } else {
                toast.error(data.error || "Failed to generate posts", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate posts", { id: toastId });
        }
    };

    const handleSavePost = async (updatedPost: Partial<SchedulerPost>) => {
        let newPosts = [...posts];

        if (updatedPost._id) {
            const index = posts.findIndex(p => p._id === updatedPost._id);
            const safePost = {
                ...editingPost,
                ...updatedPost,
                scheduledAt: updatedPost.scheduledAt ? new Date(updatedPost.scheduledAt) : undefined,
                _id: updatedPost._id,
            } as SchedulerPost;
            if (index > -1) newPosts[index] = safePost;
            setPosts(newPosts);

            toast.promise(
                fetch("/api/schedule", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: updatedPost._id,
                        content: updatedPost.content,
                        scheduledAt: updatedPost.scheduledAt,
                        isDraft: updatedPost.isDraft,
                        media: updatedPost.media,
                        mediaType: updatedPost.mediaType,
                        platform: updatedPost.platform,
                    }),
                }),
                { loading: "Saving...", success: "Post saved", error: "Failed to save" }
            );
        } else {
            const toastId = toast.loading("Creating...");
            try {
                const res = await fetch("/api/schedule", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: updatedPost.content || "New Post",
                        scheduledAt: updatedPost.scheduledAt || null,
                        isDraft: updatedPost.isDraft ?? true,
                        platform: updatedPost.platform || "linkedin",
                        media: updatedPost.media,
                        mediaType: updatedPost.mediaType,
                    }),
                });

                if (res.ok) {
                    const createdPost = await res.json();
                    const parsedPost: SchedulerPost = {
                        ...createdPost,
                        scheduledAt: createdPost.scheduledAt ? new Date(createdPost.scheduledAt) : undefined,
                        isDraft: createdPost.isDraft || !createdPost.scheduledAt,
                    };
                    setPosts(prev => [...prev, parsedPost]);
                    toast.success("Created successfully", { id: toastId });
                } else {
                    toast.error("Failed to create", { id: toastId });
                }
            } catch {
                toast.error("Error creating post", { id: toastId });
            }
        }
    };

    const handleDeletePost = async (id: string) => {
        setPosts(prev => prev.filter(p => p._id !== id));
        toast.success("Post deleted");
    };

    const handleEditPost = (post: SchedulerPost) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const postId = active.id as string;
        const post = posts.find(p => p._id === postId);
        if (!post) return;

        if (over.id === "drafts-sidebar" || over.id === "drafts-sidebar-mobile") {
            if (post.isDraft) return;
            const newPosts = posts.map(p =>
                p._id === postId ? { ...p, isDraft: true, scheduledAt: undefined } : p
            );
            setPosts(newPosts);
            toast.promise(
                fetch("/api/schedule", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: postId, isDraft: true, scheduledAt: null }),
                }),
                { loading: "Moving to drafts...", success: "Moved to Drafts", error: "Failed to save" }
            );
        } else {
            const newDate = new Date(over.id as string);
            const originalDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
            newDate.setHours(originalDate.getHours(), originalDate.getMinutes());
            const newPosts = posts.map(p =>
                p._id === postId ? { ...p, isDraft: false, scheduledAt: newDate } : p
            );
            setPosts(newPosts);
            toast.promise(
                fetch("/api/schedule", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: postId, isDraft: false, scheduledAt: newDate }),
                }),
                {
                    loading: "Rescheduling...",
                    success: `Rescheduled to ${newDate.toLocaleDateString()}`,
                    error: "Failed to reschedule",
                }
            );
        }
    };

    const handleCreateDraft = () => {
        setEditingPost(null);
        setIsModalOpen(true);
    };

    const activePost = activeId ? posts.find(p => p._id === activeId) : null;
    const scheduledCount = posts.filter(p => !p.isDraft && !p.posted).length;

    if (!mounted) return null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-background text-foreground">
                {/* Main Calendar Area */}
                <div className="flex-1 p-4 lg:p-6 flex flex-col relative z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none opacity-50" />

                    <div className="flex justify-between items-center mb-6 relative z-10 gap-3 flex-wrap">
                        {/* Month nav */}
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ChevronLeft size={20} />
                            </Button>
                            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground px-1">
                                {format(currentDate, "MMMM yyyy")}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ChevronRight size={20} />
                            </Button>
                            {scheduledCount > 0 && (
                                <span className="ml-2 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                                    {scheduledCount} scheduled
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 items-center flex-wrap">
                            {/* PRIMARY CTA — AI Generate */}
                            <button
                                onClick={() => setIsAIModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Wand2 size={16} />
                                <span>Generate Posts</span>
                            </button>

                            <button
                                onClick={() => setShowInsights(!showInsights)}
                                className={`
                                    px-3 py-2 border rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-2
                                    ${showInsights ? "bg-primary/10 text-primary border-primary/50" : "bg-card hover:bg-accent text-muted-foreground border-border hover:text-foreground"}
                                `}
                            >
                                <Sparkles size={16} />
                                <span className="hidden sm:inline">{showInsights ? "Insights On" : "Insights"}</span>
                            </button>

                            <Link href="/scheduled/reliability" className="px-3 py-2 bg-card hover:bg-accent border border-border rounded-lg text-xs md:text-sm font-medium transition-all text-muted-foreground hover:text-foreground flex items-center gap-2">
                                <Activity size={16} />
                                <span className="hidden sm:inline">Logs</span>
                            </Link>

                            <button
                                onClick={async () => {
                                    if (!confirm("Delete ALL scheduled posts?")) return;
                                    await fetch("/api/schedule/clear", { method: "DELETE" });
                                    window.location.reload();
                                }}
                                className="px-3 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-lg text-xs md:text-sm font-medium transition-all text-destructive flex items-center gap-2"
                                title="Clear All"
                            >
                                <Activity size={16} className="rotate-45" />
                                <span className="hidden sm:inline">Clear</span>
                            </button>

                            {/* Mobile Drafts Trigger */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="lg:hidden bg-card border-border text-muted-foreground">
                                        <LayoutGrid size={18} />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="p-0 w-80 border-l border-border bg-background">
                                    <SheetTitle className="sr-only">Drafts</SheetTitle>
                                    <DraftsSidebar
                                        drafts={posts.filter(p => p.isDraft)}
                                        posts={posts}
                                        onUpdatePosts={setPosts}
                                        onCreateDraft={handleCreateDraft}
                                        onDraftClick={handleEditPost}
                                        onAutoSchedule={() => setIsAIModalOpen(true)}
                                        id="drafts-sidebar-mobile"
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <CalendarGrid
                            currentDate={currentDate}
                            posts={posts.filter(p => !p.isDraft)}
                            onDateClick={() => {
                                toast("Click Generate Posts to fill your calendar with AI", { icon: "🪄" });
                            }}
                            onPostClick={handleEditPost}
                            showInsights={showInsights}
                        />
                    </div>
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:block h-full">
                    <DraftsSidebar
                        drafts={posts.filter(p => p.isDraft)}
                        posts={posts}
                        onUpdatePosts={setPosts}
                        onCreateDraft={handleCreateDraft}
                        onDraftClick={handleEditPost}
                        onAutoSchedule={() => setIsAIModalOpen(true)}
                        id="drafts-sidebar"
                    />
                </div>

                {/* Drag Overlay */}
                {createPortal(
                    <DragOverlay>
                        {activePost ? <DraggablePost post={activePost} isOverlay /> : null}
                    </DragOverlay>,
                    document.body
                )}

                {/* Post Editor */}
                <PostEditorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    post={editingPost}
                    onSave={handleSavePost}
                    onDelete={handleDeletePost}
                />

                {/* AI Post Generator (lifted to top level) */}
                <AutoIdeaModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    onGenerate={handleGeneratePosts}
                    accounts={accounts}
                />
            </div>
        </DndContext>
    );
}
