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
} from "lucide-react";
import PostToLinkedInButton from "./PostToLinkedInButton";
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
}: any) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [copied, setCopied] = useState(false);

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
          setMedia(event.target?.result as string);
          setMediaType(type);
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
    toast("Media removed", { icon: "🗑️" });
  };

  return (
    <motion.div
      className={`relative bg-[#1E1F25] rounded-2xl p-4 sm:p-5 border border-[#2E3038] shadow-lg transition-all duration-300 ${copied ? "shadow-green-500/30" : "hover:shadow-blue-900/20"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Action Icons */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={onSchedule}
          title="Schedule"
          className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition transform"
        >
          <Clock size={16} />
        </button>

        {!editing && (
          <button
            onClick={() => setEditing(true)}
            title="Edit"
            className="p-2 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition transform"
          >
            <Edit3 size={16} />
          </button>
        )}

        <button
          onClick={handleCopy}
          title="Copy"
          className={`p-2 rounded-full ${copied ? "bg-green-500/10 text-green-400 animate-pulse" : "bg-purple-500/10 text-purple-400"} hover:bg-purple-500/20 transition transform`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>

        <button
          onClick={onDelete}
          title="Delete"
          className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition transform"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow">
          Post {index + 1}/{totalPosts}
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        {editing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full min-h-[120px] sm:min-h-[150px] bg-[#15161C] border border-[#2E3038] rounded-lg text-gray-200 p-3 focus:border-blue-500 outline-none text-sm sm:text-base"
          />
        ) : (
          <p className={`text-gray-300 leading-relaxed text-sm sm:text-base ${isExpanded ? "" : "line-clamp-4"}`}>
            {editedContent}
          </p>
        )}
      </div>

      {!editing && (
        <button onClick={onToggleExpand} className="text-blue-400 text-xs font-medium mt-1 hover:underline flex items-center gap-1 transition-colors">
          <Eye size={14} />
          {isExpanded ? "Collapse" : "Full View"}
        </button>
      )}

      {/* Save / Cancel Buttons */}
      {editing && (
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <button onClick={handleSave} className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg py-2 transition">
            <Save size={16} /> Save
          </button>
          <button onClick={handleCancel} className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg py-2 transition">
            <X size={16} /> Cancel
          </button>
        </div>
      )}

      {/* Media Upload */}
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

      {/* Media Preview */}
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

      {/* Post Button */}
      <div className="mt-4">
        <PostToLinkedInButton
          content={editedContent}
          media={media}
          mediaType={mediaType}
          onSuccess={onPostSuccess}
          onError={onPostError}
          isLinkedInConnected={isLinkedInConnected}
          className="w-full bg-gradient-to-r from-[#0077B5] to-[#005885] text-white font-semibold rounded-lg py-2 hover:shadow-lg hover:scale-[1.02] transition-all"
        />
      </div>
    </motion.div>
  );
}
