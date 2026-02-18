import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Sparkles, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

export default function SchedulerWrapper() {
    const [posts, setPosts] = useState<SchedulerPost[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    // Editor State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<SchedulerPost | null>(null);
    const [showInsights, setShowInsights] = useState(false); // Insights Toggle

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Prevent accidental drags
            },
        })
    );

    useEffect(() => {
        setMounted(true);
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/schedule");
            const data = await res.json();
            if (Array.isArray(data)) {
                // Transform to SchedulerPost
                const mapped: SchedulerPost[] = data.map((p: any) => ({
                    ...p,
                    _id: p._id,
                    scheduledAt: new Date(p.scheduledAt),
                    isDraft: !p.scheduledAt // Basic draft logic
                }));
                setPosts(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
            toast.error("Could not load schedule");
        }
    };

    const handleSavePost = async (updatedPost: Partial<SchedulerPost>) => {
        // Optimistic UI for updates
        let newPosts = [...posts];

        if (updatedPost._id) {
            const index = posts.findIndex(p => p._id === updatedPost._id);

            const safePost = {
                ...editingPost,
                ...updatedPost,
                scheduledAt: updatedPost.scheduledAt ? new Date(updatedPost.scheduledAt) : undefined,
                _id: updatedPost._id // Ensure ID exists
            } as SchedulerPost;

            if (index > -1) {
                newPosts[index] = safePost;
            }
            setPosts(newPosts);

            // API Call (Update)
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
                        platform: updatedPost.platform
                    })
                }),
                {
                    loading: "Saving...",
                    success: "Post saved",
                    error: "Failed to save"
                }
            );
        } else {
            // Create New Post
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
                        linkedinId: "user-123" // TODO: Real user
                    })
                });

                if (res.ok) {
                    const createdPost = await res.json();
                    const parsedPost: SchedulerPost = {
                        ...createdPost,
                        scheduledAt: createdPost.scheduledAt ? new Date(createdPost.scheduledAt) : undefined,
                        isDraft: !createdPost.scheduledAt
                    };
                    setPosts(prev => [...prev, parsedPost]);
                    toast.success("Created successfully", { id: toastId });
                } else {
                    toast.error("Failed to create", { id: toastId });
                }
            } catch (e) {
                toast.error("Error creating post", { id: toastId });
            }
        }
    };

    const handleDeletePost = async (id: string) => {
        setPosts(prev => prev.filter(p => p._id !== id));
        // TODO: Add DELETE endpoint
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
        const post = posts.find((p) => p._id === postId);

        if (!post) return;

        if (over.id === "drafts-sidebar" || over.id === "drafts-sidebar-mobile") {
            // Move to drafts
            if (post.isDraft) return;

            const newPosts = posts.map((p) =>
                p._id === postId ? { ...p, isDraft: true, scheduledAt: undefined } : p
            );
            setPosts(newPosts);
            toast.promise(
                fetch("/api/schedule", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: postId, isDraft: true, scheduledAt: null })
                }),
                {
                    loading: "Moving to drafts...",
                    success: "Moved to Drafts",
                    error: "Failed to save"
                }
            );
        } else {
            // Scheduled to a date
            const newDate = new Date(over.id as string);

            // Preserve time from original post
            const originalDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
            newDate.setHours(originalDate.getHours(), originalDate.getMinutes());

            const newPosts = posts.map((p) =>
                p._id === postId ? { ...p, isDraft: false, scheduledAt: newDate } : p
            );
            setPosts(newPosts);

            toast.promise(
                fetch("/api/schedule", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: postId, isDraft: false, scheduledAt: newDate })
                }),
                {
                    loading: "Rescheduling...",
                    success: `Rescheduled to ${newDate.toLocaleDateString()}`,
                    error: "Failed to reschedule"
                }
            );
        }
    };

    const handleCreateDraft = () => {
        setEditingPost(null);
        setIsModalOpen(true);
    };

    const activePost = activeId ? posts.find((p) => p._id === activeId) : null;

    if (!mounted) return null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-background text-foreground">
                {/* Main Calendar Area */}
                <div className="flex-1 p-4 lg:p-6 flex flex-col relative z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none opacity-50" />

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h2 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground truncate flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ChevronLeft size={20} />
                            </Button>
                            {format(currentDate, "MMMM yyyy")}
                            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <ChevronRight size={20} />
                            </Button>
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowInsights(!showInsights)}
                                className={`
                                    px-3 py-2 border rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-2
                                    ${showInsights ? "bg-primary/10 text-primary border-primary/50" : "bg-card hover:bg-accent text-muted-foreground border-border hover:text-foreground"}
                                `}
                            >
                                <Sparkles size={16} />
                                <span className="hidden sm:inline">{showInsights ? "AI Insights On" : "Show Insights"}</span>
                            </button>
                            <Link href="/scheduled/reliability" className="px-3 py-2 bg-card hover:bg-accent border border-border hover:border-sidebar-border rounded-lg text-xs md:text-sm font-medium transition-all text-muted-foreground hover:text-foreground flex items-center gap-2">
                                <Activity size={16} />
                                <span className="hidden sm:inline">Logs</span>
                            </Link>
                            <button
                                onClick={async () => {
                                    if (!confirm("Are you sure? This will delete ALL scheduled posts.")) return;
                                    await fetch("/api/schedule/clear", { method: "DELETE" });
                                    window.location.reload(); // Simple refresh for now
                                }}
                                className="px-3 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-lg text-xs md:text-sm font-medium transition-all text-destructive flex items-center gap-2"
                                title="Clear All Schedule"
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
                                    <DraftsSidebar
                                        drafts={posts.filter(p => p.isDraft)}
                                        posts={posts}
                                        onUpdatePosts={setPosts}
                                        onCreateDraft={handleCreateDraft}
                                        onDraftClick={handleEditPost}
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
                            onDateClick={(d) => {
                                // Optional: Create new post on specific date
                                // For now, guidance
                                toast("Click '+ New Idea' to start", { icon: '💡' });
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

                <PostEditorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    post={editingPost}
                    onSave={handleSavePost}
                    onDelete={handleDeletePost}
                />
            </div>
        </DndContext>
    );
}
