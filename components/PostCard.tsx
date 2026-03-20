"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Clock,
  Edit2,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  Video,
  X,
  Save,
  Loader2,
  Share2,

  MoreHorizontal,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PostCard({
  post,
  index,
  totalPosts,
  isExpanded,
  onToggleExpand,
  onSchedule,
  onCopy,
  onPostSuccess,
  onPostError,
  onDelete,
  isLinkedInConnected,
  onUpdateMedia,
}: any) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [media, setMedia] = useState<string | null>(post.media || null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(post.mediaType || null);
  const [copied, setCopied] = useState(false);
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);

  const [postingLoading, setPostingLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");

  // Refine handler
  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent, instruction: refinePrompt })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEditedContent(data.refined);
      setEditing(true); // Switch to edit mode to review
      toast.success("AI Rewrote your post!");
    } catch {
      toast.error("Failed to refine");
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success("Copied to clipboard!");
    onCopy?.();
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMediaUpload = (type: "image" | "video") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "image" ? "image/*" : "video/*";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        // Size Check (e.g. 50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast.error("File is too large (max 50MB)");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base = event.target?.result as string;
          setMedia(base);
          setMediaType(type);
          onUpdateMedia(post.id, base, type);
          toast.success(`${type === "image" ? "Image" : "Video"} added!`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSave = () => {
    post.content = editedContent;
    setEditing(false);
    toast.success("Post updated!");
  };

  const handleCancel = () => {
    setEditedContent(post.content);
    setEditing(false);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setMediaType(null);
    onUpdateMedia(post.id, null, null);
    toast.success("Media removed");
  };

  const confirmDelete = () => {
    onDelete?.();
  };

  const handlePost = async () => {
    setPostingLoading(true);
    try {
      const res = await fetch("/api/social");
      const accounts = await res.json();
      const connected = (accounts || []).filter((a: any) => a.connected);
      if (!connected.length) {
        toast.error("No connected accounts. Go to Links page.");
        setPostConfirmOpen(false);
        return;
      }
      const postPromises = connected.map(async (acc: any) => {
        const r = await fetch("/api/social/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: acc.platform,
            accountId: acc._id,
            content: editedContent,
            media: media || null,
            mediaType: mediaType || null,
          }),
        });
        return { ok: r.ok, platform: acc.platform, data: await r.json().catch(() => ({})) };
      });
      const results = await Promise.all(postPromises);
      const okCount = results.filter(r => r.ok).length;

      if (okCount > 0) {
        onPostSuccess(post.id);
        toast.success(`Posted to ${okCount} of ${connected.length} accounts`);
      } else {
        const firstError = results[0]?.data?.details || results[0]?.data?.error || "Failed to post";
        onPostError(firstError);
        toast.error(firstError);
      }
    } catch (err) {
      onPostError("Error posting");
      toast.error("Failed to post");
    } finally {
      setPostingLoading(false);
      setPostConfirmOpen(false);
    }
  };

  return (
    <motion.div
      className="group relative bg-card rounded-2xl border border-border/60 hover:border-gold/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-gold/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/10 text-gold font-bold text-xs shadow-sm border border-gold/20">
            AI
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground group-hover:text-gold/80 transition-colors">Generated Draft</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground/80">Now</p>
              {post.platform && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">{post.platform}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onSchedule} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Clock className="w-4 h-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
              <DropdownMenuItem onClick={handleRefine} className="cursor-pointer hover:bg-muted text-xs text-primary">
                {isRefining ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                AI Rewrite / Fix
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy} className="cursor-pointer hover:bg-muted text-xs">
                <Copy className="w-3.5 h-3.5 mr-2" /> Copy Text
              </DropdownMenuItem>
              {/* SAVE DRAFT BUTTON */}
              <DropdownMenuItem onClick={() => {
                fetch('/api/drafts', {
                  method: 'POST',
                  body: JSON.stringify({
                    userEmail: "guest@example.com", // TODO: Use session
                    content: post.content,
                    platform: post.platform || "LinkedIn",
                    media: media,
                    type: mediaType || 'text'
                  })
                }).then(() => toast.success("Draft Saved!"));
              }} className="cursor-pointer hover:bg-muted text-xs">
                <Save className="w-3.5 h-3.5 mr-2" /> Save to Drafts
              </DropdownMenuItem>

              <DropdownMenuItem onClick={confirmDelete} className="cursor-pointer hover:bg-red-900/20 text-red-400 text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-5">
        {/* Content Editor/Viewer */}
        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[200px] bg-muted/50 border border-primary/30 rounded-xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm leading-relaxed resize-none"
              autoFocus
            />

            {/* AI Refine Bar */}
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Ask AI to rewrite (e.g. 'Make it funnier', 'Shorter')..."
                  className="w-full h-10 pl-3 pr-10 rounded-lg bg-muted border border-border text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                />
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !refinePrompt.trim()}
                  className="absolute right-1 top-1 h-8 w-8 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                  title="Refine with AI"
                >
                  {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button size="sm" variant="ghost" onClick={handleCancel} className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground h-10">Cancel</Button>
                <Button size="sm" onClick={handleSave} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10">
                  <Save className="w-3.5 h-3.5" /> Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group/content">
            <div
              className={`text-foreground/90 text-sm leading-7 whitespace-pre-wrap font-light ${isExpanded ? "" : "line-clamp-6"}`}
              onClick={() => setEditing(true)}
            >
              {editedContent}
            </div>

            {/* Quick Edit Overlay */}
            <div
              onClick={() => setEditing(true)}
              className="absolute inset-0 bg-primary/5 opacity-0 group-hover/content:opacity-100 flex items-center justify-center cursor-text transition-opacity rounded-lg pointer-events-none"
            >
              <span className="bg-popover text-xs px-3 py-1.5 rounded-full border border-border shadow-xl flex items-center gap-2 text-primary">
                <Edit2 className="w-3 h-3" /> Click to Edit
              </span>
            </div>

            {!isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="mt-2 text-xs text-primary font-medium hover:text-primary/80 flex items-center gap-1"
              >
                {isExpanded ? "Show Less" : "Read More"}
              </button>
            )}
          </div>
        )}

        {/* Media Section */}
        {!editing && (
          <div className="mt-6 space-y-4">
            {media ? (
              <div className="relative rounded-xl overflow-hidden border border-border group/media bg-black">
                {mediaType === "image" ? (
                  <img src={media} alt="Attached" className="w-full max-h-[400px] object-cover" />
                ) : (
                  <video src={media} controls className="w-full max-h-[400px]" />
                )}
                <button
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-all backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => handleMediaUpload("image")} className="flex-1 border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl py-4 flex flex-col items-center gap-2 transition-all group/btn">
                  <div className="p-2 rounded-full bg-muted group-hover/btn:bg-primary/20 text-muted-foreground group-hover/btn:text-primary transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium group-hover/btn:text-foreground">Add Image</span>
                </button>
                <button
                  onClick={async () => {
                    const prompt = editedContent.trim().slice(0, 200);
                    if (!prompt) return toast.error("Post content is empty");
                    toast.loading("Generating AI Image...");
                    try {
                      const res = await fetch('/api/generateImages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt })
                      });
                      const data = await res.json();
                      if (data.success && data.imageUrl) {
                        setMedia(data.imageUrl);
                        setMediaType("image");
                        onUpdateMedia(post.id, data.imageUrl, "image");
                        toast.dismiss();
                        toast.success("AI Image Generated!");
                      } else {
                        throw new Error("Failed");
                      }
                    } catch {
                      toast.dismiss();
                      toast.error("Generation failed");
                    }
                  }}
                  className="flex-1 border border-dashed border-border hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl py-4 flex flex-col items-center gap-2 transition-all group/btn"
                >
                  <div className="p-2 rounded-full bg-muted group-hover/btn:bg-purple-500/20 text-muted-foreground group-hover/btn:text-purple-400 transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium group-hover/btn:text-foreground">Generate AI Image</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Credibility Score Indicator */}
        {post.credibilityScore && (
          <div className="mt-4 mb-2 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Credibility Score</span>
                {post.credibilityScore.score > 90 && <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded-md font-medium">Excellent</span>}
                {post.credibilityScore.score <= 90 && post.credibilityScore.score > 70 && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-md font-medium">Good</span>}
                {post.credibilityScore.score <= 70 && <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-600 rounded-md font-medium">AI Heavy</span>}
              </div>
              <span className={`text-sm font-bold ${post.credibilityScore.score > 90 ? "text-green-600" :
                  post.credibilityScore.score > 70 ? "text-yellow-600" : "text-red-500"
                }`}>{post.credibilityScore.score}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${post.credibilityScore.score > 90 ? "bg-green-500" :
                    post.credibilityScore.score > 70 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                style={{ width: `${post.credibilityScore.score}%` }}
              />
            </div>
            {post.credibilityScore.flaggedWords?.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                <span className="font-medium text-red-400">Flagged Words:</span> {post.credibilityScore.flaggedWords.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-6 pt-4 border-t border-border flex gap-3">
          <Button
            onClick={() => setPostConfirmOpen(true)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 border-0 h-11 transition-all active:scale-[0.98]"
          >
            {postingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Post Now</div>}
          </Button>

          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex-1 border-border bg-muted/50 hover:bg-muted hover:text-foreground text-muted-foreground h-11"
          >
            {copied ? <div className="flex items-center gap-2 text-green-500"><Check className="w-4 h-4" /> Copied</div> : <div className="flex items-center gap-2"><Copy className="w-4 h-4" /> Copy</div>}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {postConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-foreground">Ready to Launch?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You are about to post this content to all connected platforms.
            </p>

            <div className="bg-muted/30 p-4 rounded-xl border border-border mb-6 max-h-[300px] overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap">{editedContent}</p>
              {media && <div className="mt-4 rounded-lg overflow-hidden border border-border">
                {mediaType === 'image' ? <img src={media} className="w-full object-cover max-h-48" /> : <video src={media} controls className="w-full max-h-48" />}
              </div>}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setPostConfirmOpen(false)} className="text-muted-foreground hover:text-foreground">Back</Button>
              <Button onClick={handlePost} disabled={postingLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-6">
                {postingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Post"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}