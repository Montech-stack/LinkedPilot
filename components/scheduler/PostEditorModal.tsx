import React, { useState, useEffect } from "react";
import { SchedulerPost } from "./types";
import { X, Image as ImageIcon, Video, Sparkles, Calendar, Clock, Save, Trash2, Mic, Maximize2, Edit3, Download, Plus } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AudioRecorder from "./AudioRecorder";

// Image Context Interface
interface ImageContext {
    _id: string;
    name: string;
    triggerWord: string;
    referenceImageUrls?: string[];
}

interface PostEditorModalProps {
    post: SchedulerPost | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (post: Partial<SchedulerPost>) => void;
    onDelete?: (id: string) => void;
}

export default function PostEditorModal({ post, isOpen, onClose, onSave, onDelete }: PostEditorModalProps) {
    const router = useRouter();
    const [content, setContent] = useState("");
    const [platform, setPlatform] = useState("linkedin");
    const [scheduledDate, setScheduledDate] = useState<string>("");
    const [scheduledTime, setScheduledTime] = useState<string>("");
    const [media, setMedia] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Image Context State
    const [contexts, setContexts] = useState<ImageContext[]>([]);
    const [selectedContextId, setSelectedContextId] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            fetchContexts();
        }
    }, [isOpen]);

    const fetchContexts = async () => {
        try {
            const res = await fetch("/api/studio/contexts");
            if (res.ok) {
                const data = await res.json();
                setContexts(data);
            }
        } catch (e) {
            console.error("Failed to load contexts");
        }
    };

    useEffect(() => {
        if (post) {
            setContent(post.content);
            setPlatform(post.platform || "linkedin");
            setMedia(post.media || null);
            setMediaType(post.mediaType || (post.media ? "image" : null));

            if (post.scheduledAt) {
                const date = new Date(post.scheduledAt);
                setScheduledDate(format(date, "yyyy-MM-dd"));
                setScheduledTime(format(date, "HH:mm"));
            } else {
                setScheduledDate("");
                setScheduledTime("");
            }
        } else {
            setContent("");
            setPlatform("linkedin");
            setMedia(null);
            setMediaType(null);
            setScheduledDate("");
            setScheduledTime("");
        }
    }, [post, isOpen]);

    if (!isOpen) return null;

    const handleAiOptimize = async () => {
        if (!content) return toast.error("Write something first!");
        setIsAiProcessing(true);
        const toastId = toast.loading("Enhancing with AI...");
        try {
            const res = await fetch("/api/schedule/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    platform,
                    instruction: "Make it more engaging and professional."
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.content) {
                    setContent(data.content);
                    toast.success("Enhanced!", { id: toastId });
                } else {
                    toast.error("AI returned empty", { id: toastId });
                }
            } else {
                toast.error("AI service error", { id: toastId });
            }
        } catch (e) {
            toast.error("Failed to connect to AI", { id: toastId });
        } finally {
            setIsAiProcessing(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!content) return toast.error("Need content to generate image!");
        setIsGeneratingImage(true);
        const toastId = toast.loading("Dreaming up image...");

        try {
            const selectedContext = contexts.find(c => c._id === selectedContextId);
            const trigger = selectedContext ? ` in the style of ${selectedContext.triggerWord}` : "";

            // Extract a visual subject from content or use the whole thing
            const subject = content.length > 100 ? content.substring(0, 100) : content;
            const prompt = `${subject}${trigger}, high quality, professional social media image`;

            const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    width: 1024,
                    height: 1024,
                    refImage: selectedContext?.referenceImageUrls?.[0] // Optional ref image
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setMedia(data.url);
                    setMediaType("image");
                    toast.success("Image generated!", { id: toastId });
                } else {
                    throw new Error("No URL");
                }
            } else {
                throw new Error("API Error");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate", { id: toastId });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImg = file.type.startsWith("image/");
        const isVid = file.type.startsWith("video/");

        if (file.size > 10 * 1024 * 1024) {
            return toast.error("File likely too large for demo (max 10MB)");
        }

        const reader = new FileReader();
        reader.onload = () => {
            setMedia(reader.result as string);
            setMediaType(isImg ? "image" : isVid ? "video" : null);
        };
        reader.readAsDataURL(file);
    };

    const handleOpenInStudio = () => {
        if (!content) return toast.error("No content to open in Studio");
        const url = `/dashboard?draft=${encodeURIComponent(content)}`;
        router.push(url);
    };

    const handleSave = () => {
        let finalDate: Date | null = null;
        if (scheduledDate) {
            finalDate = new Date(scheduledDate + "T" + (scheduledTime || "09:00"));
        }
        onSave({
            ...post,
            content,
            platform,
            media: media || undefined,
            mediaType: mediaType || undefined,
            scheduledAt: finalDate || undefined,
            isDraft: !finalDate
        });
        onClose();
    };

    const handleTranscription = (text: string) => {
        setContent(prev => (prev ? prev + "\n\n" : "") + text);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row h-[85vh]">

                {/* Left Column: Editor */}
                <div className="flex-1 flex flex-col border-r border-border min-w-[400px]">
                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${post?.isDraft ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>
                                {post?.isDraft ? <Sparkles size={18} /> : <Calendar size={18} />}
                            </div>
                            {post?.isDraft ? "Edit Idea" : "Edit Post"}
                        </h3>
                        <div className="flex gap-2">
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none"
                            >
                                <option value="linkedin">LinkedIn</option>
                                <option value="twitter">X (Twitter)</option>
                                <option value="instagram">Instagram</option>
                            </select>
                            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                        <div className="relative flex-1">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={`What's on your mind? Type or use voice...`}
                                className="w-full h-full min-h-[200px] bg-transparent border-none text-foreground text-lg focus:outline-none resize-none p-2 placeholder:text-muted-foreground/40 leading-relaxed"
                            />
                            {/* Toolbar */}
                            <div className="absolute bottom-2 right-2 flex gap-2 items-center">
                                <AudioRecorder onTranscription={handleTranscription} />
                                <button
                                    onClick={handleAiOptimize}
                                    disabled={isAiProcessing}
                                    className="p-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-full transition-all disabled:opacity-50"
                                    title="AI Enhance"
                                >
                                    <Sparkles size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Context Selector for Images */}
                        {contexts.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                                <span className="text-xs font-medium text-muted-foreground">Image Style:</span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedContextId("")}
                                        className={`text-xs px-2 py-1 rounded-md transition-colors ${selectedContextId === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                    >
                                        None
                                    </button>
                                    {contexts.map(ctx => (
                                        <button
                                            key={ctx._id}
                                            onClick={() => setSelectedContextId(ctx._id)}
                                            className={`text-xs px-2 py-1 rounded-md transition-colors ${selectedContextId === ctx._id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                        >
                                            {ctx.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                title="Upload Media"
                            >
                                <ImageIcon size={20} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage}
                                className="p-2 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Generate AI Image"
                            >
                                <Sparkles size={20} />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm">Cancel</button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg shadow-primary/20 transition-all font-medium text-sm"
                            >
                                <Save size={16} />
                                {scheduledDate ? "Schedule" : "Save Draft"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview & Settings */}
                <div className="w-[350px] bg-muted/10 p-6 space-y-6 overflow-y-auto">

                    {/* Media Preview Block */}
                    <div className="aspect-square w-full rounded-xl border border-border bg-black/5 dark:bg-black/40 flex items-center justify-center relative overflow-hidden group">
                        {media ? (
                            <>
                                {mediaType === "video" ? (
                                    <video src={media} controls className="w-full h-full object-cover" />
                                ) : (
                                    <img src={media} alt="Preview" className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setMedia(null); setMediaType(null); }}
                                        className="bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => window.open(media, "_blank")}
                                        className="bg-black/60 hover:bg-blue-500 text-white p-1.5 rounded-full backdrop-blur-sm"
                                    >
                                        <Maximize2 size={14} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6 text-muted-foreground">
                                <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No media attached</p>
                                <button onClick={handleGenerateImage} className="text-xs text-purple-500 mt-2 hover:underline">
                                    Generate with AI
                                </button>
                            </div>
                        )}
                        {isGeneratingImage && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                                <div className="flex flex-col items-center gap-2">
                                    <Sparkles className="w-8 h-8 text-purple-500 animate-spin" />
                                    <p className="text-xs font-medium text-purple-500">Generating...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scheduling Details */}
                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schedule</label>
                        <div className="space-y-3">
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3 top-3 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div className="relative">
                                <Clock size={14} className="absolute left-3 top-3 text-muted-foreground" />
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Helper Links */}
                    <div className="pt-4 border-t border-border">
                        <button
                            onClick={handleOpenInStudio}
                            className="w-full py-2 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-xs font-medium transition-colors"
                        >
                            Open in Full Studio <Maximize2 size={12} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
