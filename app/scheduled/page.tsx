"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Trash2,
  Play,
  Copy,
  Edit,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

export default function ScheduledPage() {
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [editingPost, setEditingPost] = useState<any>(null);
  const [reschedulePost, setReschedulePost] = useState<any>(null);
  const [editText, setEditText] = useState("");

  const [newDate, setNewDate] = useState("");

  // Fetch scheduled posts
  useEffect(() => {
    const fetchScheduled = async () => {
      try {
        const res = await fetch("/api/schedule");
        const data = await res.json();
        setScheduledPosts(data);
      } catch (error) {
        toast.error("Failed to load scheduled posts");
      } finally {
        setLoading(false);
      }
    };
    fetchScheduled();
  }, []);

  // Cancel schedule
  const cancelSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) return toast.error("Failed to cancel");

      setScheduledPosts((prev) => prev.filter((p) => p._id !== id));
      toast("Cancelled 🚫");
    } catch {
      toast.error("Error canceling");
    }
  };

  // Save edited content
  const saveEdit = async () => {
    try {
      const res = await fetch(`/api/schedule/${editingPost._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });

      if (!res.ok) return toast.error("Failed updating");

      setScheduledPosts((prev) =>
        prev.map((p) =>
          p._id === editingPost._id ? { ...p, content: editText } : p
        )
      );

      toast.success("Updated ✅");
      setEditingPost(null);
    } catch {
      toast.error("Failed");
    }
  };

  // Save reschedule
  const saveReschedule = async () => {
    try {
      const res = await fetch(`/api/schedule/${reschedulePost._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: newDate }),
      });

      if (!res.ok) return toast.error("Failed reschedule");

      setScheduledPosts((prev) =>
        prev.map((p) =>
          p._id === reschedulePost._id ? { ...p, scheduledAt: newDate } : p
        )
      );

      toast.success("Rescheduled ⏰");
      setReschedulePost(null);
    } catch {
      toast.error("Error");
    }
  };

  const timeUntil = (date: string) => {
    const ms = new Date(date).getTime() - Date.now();
    if (ms < 0) return "Expired";
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  return (
    <div className="min-h-screen bg-[#0F1116] text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto w-full px-6 py-10"
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Scheduled Posts
          </h1>
          <p className="text-gray-400 mb-8">
            Manage upcoming content scheduled to post automatically ✅
          </p>

          {loading && (
            <div className="text-center text-gray-300 p-10">
              Loading scheduled posts...
            </div>
          )}

          {!loading && scheduledPosts.length === 0 && (
            <div className="text-gray-500 text-center p-10">
              You have no scheduled posts yet.
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledPosts.map((post: any, idx) => (
              <motion.div
                key={post._id}
                whileHover={{ scale: 1.02 }}
                className="bg-[#1E1F25] border border-[#2E3038] rounded-2xl p-5 shadow-lg transition-all"
              >
                {/* Media */}
                {post.media && (
                  <div className="mb-3 relative">
                    {post.mediaType === "video" ? (
                      <video src={post.media} className="rounded-lg" muted />
                    ) : (
                      <img src={post.media} className="rounded-lg" />
                    )}
                  </div>
                )}

                {/* Content */}
                <p className="text-gray-300 text-sm mb-3">
                  {expanded === post._id
                    ? post.content
                    : post.content.slice(0, 120)}
                  {post.content.length > 120 && (
                    <button
                      className="text-blue-400 text-xs ml-1"
                      onClick={() =>
                        setExpanded(expanded === post._id ? null : post._id)
                      }
                    >
                      {expanded === post._id ? "Show less" : "Read more"}
                    </button>
                  )}
                </p>

                {/* Time */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <Clock size={12} />
                  {new Date(post.scheduledAt).toLocaleString()} •{" "}
                  <span className="text-blue-400 font-semibold">
                    {timeUntil(post.scheduledAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(post.content);
                      toast("Copied 📋");
                    }}
                    className="hover:text-white"
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    onClick={() => {
                      setEditText(post.content);
                      setEditingPost(post);
                    }}
                    className="hover:text-white"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={() => {
                      setNewDate(post.scheduledAt.slice(0, 16));
                      setReschedulePost(post);
                    }}
                    className="hover:text-white"
                  >
                    <Calendar size={14} />
                  </button>

                  <button
                    onClick={() => cancelSchedule(post._id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#1E1F25] p-6 rounded-xl max-w-lg w-full border border-[#2E3038]">
            <h2 className="text-xl font-bold mb-3">Edit Content</h2>
            <textarea
              className="w-full bg-[#0F1116] border border-[#2E3038] p-3 rounded-lg h-40 outline-none text-sm"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={saveEdit}
                className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setEditingPost(null)}
                className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulePost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#1E1F25] p-6 rounded-xl max-w-lg w-full border border-[#2E3038]">
            <h2 className="text-xl font-bold mb-3">Reschedule</h2>
            <input
              type="datetime-local"
              className="w-full bg-[#0F1116] border border-[#2E3038] p-3 rounded-lg outline-none text-sm"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={saveReschedule}
                className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setReschedulePost(null)}
                className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
