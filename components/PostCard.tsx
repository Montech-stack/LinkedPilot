"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Clock,
  Edit3,
  Copy,
  Check,
  Trash2,
  ImageIcon,
  Video,
  X,
  Save,
  Loader2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

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
  onUpdateMedia, // ✅ NEW
}: any) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [media, setMedia] = useState<string | null>(post.media || null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(post.mediaType || null);
  const [copied, setCopied] = useState(false);
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [postingLoading, setPostingLoading] = useState(false);

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
        const reader = new FileReader();
        reader.onload = (event) => {
          const base = event.target?.result as string;
          setMedia(base);
          setMediaType(type);
          // ✅ push to parent
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
    // ✅ update parent too
    onUpdateMedia(post.id, null, null);
    toast("Media removed", { icon: "🗑️" });
  };

  const confirmDelete = () => {
    if (confirm("Delete this post?")) {
      onDelete?.();
    }
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
      const postPromises = connected.map((acc: any) =>
        fetch("/api/social/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: acc.platform,
            accountId: acc._id,
            content: editedContent,
            media: media || null,
            mediaType: mediaType || null,
          }),
        })
      );
      const results = await Promise.all(postPromises);
      const okCount = results.filter(r => r.ok).length;
      const message = `Posted to ${okCount}/${connected.length} account${okCount > 1 ? "s" : ""}`;
      if (okCount > 0) {
        onPostSuccess(post.id);
        if (okCount === connected.length) {
          toast.success(message);
        } else {
          toast(message);
        }
      } else {
        onPostError("Failed to post");
        toast.error(message);
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
      className={`relative bg-[#1E1F25] rounded-2xl p-5 border border-[#2E3038] shadow-lg transition-all duration-300 ${copied ? "shadow-green-500/30" : "hover:shadow-blue-900/20"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Action Icons */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button onClick={onSchedule} title="Schedule" className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:scale-110 transition-all">
          <Clock size={16} />
        </button>
        {!editing && (
          <button onClick={() => setEditing(true)} title="Edit" className="p-2 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:scale-110 transition-all">
            <Edit3 size={16} />
          </button>
        )}
        <button onClick={handleCopy} title="Copy" className={`p-2 rounded-full ${copied ? "bg-green-500/10 text-green-400 animate-pulse" : "bg-purple-500/10 text-purple-400"} hover:bg-purple-500/20 hover:scale-110 transition-all`}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button onClick={confirmDelete} title="Delete" className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:scale-110 transition-all">
          <Trash2 size={16} />
        </button>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
          Post {index + 1}/{totalPosts}
        </span>
      </div>
      {/* Content */}
      <div className="mb-3">
        {editing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full min-h-[150px] bg-[#15161C] border border-[#2E3038] rounded-lg text-gray-200 p-3 focus:border-blue-500 outline-none text-sm"
          />
        ) : (
          <div
            className={`text-gray-300 leading-relaxed text-sm ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-4 whitespace-pre-wrap"}`}
          >
            {editedContent}
          </div>
        )}
      </div>
      {!editing && (
        <button onClick={onToggleExpand} className="text-blue-400 text-xs font-medium mt-1 hover:underline flex items-center gap-1 transition-colors">
          <Eye size={14} />
          {isExpanded ? "Collapse" : "Full View"}
        </button>
      )}
      {editing && (
        <div className="flex flex-col xs:flex-row gap-3 mt-3">
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg py-2 transition">
            <Save size={16} /> Save
          </button>
          <button onClick={handleCancel} className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg py-2 transition">
            <X size={16} /> Cancel
          </button>
        </div>
      )}
      {!editing && (
        <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
          <button onClick={() => handleMediaUpload("image")} className="p-3 rounded-xl border-2 border-dashed border-sky-400/30 bg-[#15161C] hover:bg-[#23242C] transition flex flex-col items-center">
            <ImageIcon className="text-sky-400 w-6 h-6 mb-2" />
            <span className="text-gray-300 text-xs font-medium">Add Image</span>
          </button>
          <button onClick={() => handleMediaUpload("video")} className="p-3 rounded-xl border-2 border-dashed border-purple-400/30 bg-[#15161C] hover:bg-[#23242C] transition flex flex-col items-center">
            <Video className="text-purple-400 w-6 h-6 mb-2" />
            <span className="text-gray-300 text-xs font-medium">Add Video</span>
          </button>
        </div>
      )}
      {media && (
        <div className="relative mt-3">
          {mediaType === "image" ? (
            <img src={media} alt="Preview" className="rounded-lg w-full object-cover border border-[#2E3038]" />
          ) : (
            <video src={media} controls className="rounded-lg w-full border border-[#2E3038]" />
          )}
          <button onClick={handleRemoveMedia} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition">
            <X size={14} />
          </button>
        </div>
      )}
      <div className="mt-4">
        <Button
          onClick={() => setPostConfirmOpen(true)}
          disabled={postingLoading}
          className="w-full h-10 px-3.5 text-sm font-medium rounded-lg bg-orange-400 hover:bg-orange-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {postingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Post
        </Button>
      </div>
      {/* Post Confirmation Modal */}
      {postConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-[#14151a] border border-[#2c2f3a] rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Post to all connected platforms</h3>
            <p className="text-sm text-gray-300 mb-4">
              This will post to all connected accounts. Manage them on the Links page.
            </p>
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Preview</div>
              <div className="bg-[#0f1317] p-3 rounded-md border border-[#2c2f3a] max-h-48 overflow-y-auto text-sm text-gray-200 whitespace-pre-wrap">
                {editedContent}
                {media && (
                  <div className="mt-3">
                    {mediaType === "image" ? <img src={media} alt="preview" className="max-h-40 w-full object-contain rounded-md" /> : <video src={media} controls className="max-h-40 w-full rounded-md" />}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPostConfirmOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancel</button>
              <button onClick={handlePost} disabled={postingLoading} className="px-4 py-2 rounded-lg bg-[#0077B5] hover:bg-[#005885] flex items-center gap-2 disabled:opacity-50">
                {postingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm & Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}