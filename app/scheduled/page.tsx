"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Trash2,
  Calendar,
  Edit2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday
} from "date-fns";

export default function ScheduledPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generation Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genFormData, setGenFormData] = useState({
    topics: "",
    frequency: 3,
    tone: "Professional",
    platform: "LinkedIn"
  });

  // Quick Post State
  const [quickPostDate, setQuickPostDate] = useState<Date | null>(null);
  const [quickPostContent, setQuickPostContent] = useState("");
  const [quickPostTime, setQuickPostTime] = useState("09:00");
  const [quickPostLoading, setQuickPostLoading] = useState(false);

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?mode=all`); // Fetch all for calendar view
      const data = await res.json();
      setScheduledPosts(data);
    } catch (error) {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!genFormData.topics.trim()) return toast.error("Please enter a topic");

    setGenLoading(true);
    try {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: genFormData.topics,
          frequency: genFormData.frequency,
          tone: genFormData.tone,
          platform: genFormData.platform,
          startDate: format(new Date(), "yyyy-MM-dd")
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(`Generated ${data.count} posts!`);
      setIsGenModalOpen(false);
      fetchScheduled(); // Refresh calendar
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setScheduledPosts(prev => prev.filter(p => p._id !== id));
      toast.success("Scheduled post cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const handleQuickPost = async () => {
    if (!quickPostContent.trim()) return toast.error("Content required");
    if (!quickPostDate) return;

    setQuickPostLoading(true);
    try {
      // Combine date and time
      const dateStr = format(quickPostDate, "yyyy-MM-dd");
      const dateTime = new Date(`${dateStr}T${quickPostTime}:00`);

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: quickPostContent,
          scheduledAt: dateTime,
          platform: "linkedin", // Default
          media: null,
          mediaType: null
        })
      });

      if (!res.ok) throw new Error("Failed to schedule");

      toast.success("Post scheduled!");
      setQuickPostDate(null);
      setQuickPostContent("");
      fetchScheduled();
    } catch (e) {
      toast.error("Failed to schedule post");
    } finally {
      setQuickPostLoading(false);
    }
  };

  // --- Calendar Logic ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  // Decide Grid Range
  let startDate, endDate;
  if (viewMode === "month") {
    startDate = startOfWeek(monthStart);
    endDate = endOfWeek(monthEnd);
  } else {
    startDate = startOfWeek(currentDate);
    endDate = endOfWeek(currentDate);
  }

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextPeriod = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(curr => new Date(curr.setDate(curr.getDate() + 7)));
  };

  const prevPeriod = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(curr => new Date(curr.setDate(curr.getDate() - 7)));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getPostsForDay = (day: Date) => {
    return scheduledPosts.filter(post => isSameDay(new Date(post.scheduledAt), day));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 w-full h-full flex flex-col">

            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 py-1">
                  Content Calendar
                </h1>

                {/* View Toggles */}
                <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                  <button
                    onClick={() => setViewMode("month")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === "month" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === "week" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Week
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
                  <button onClick={prevPeriod} className="p-1 hover:bg-background rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
                  <button onClick={goToToday} className="px-3 py-1 text-sm font-semibold hover:bg-background rounded-md transition-colors min-w-[100px]">
                    {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d")}
                  </button>
                  <button onClick={nextPeriod} className="p-1 hover:bg-background rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
                </div>
              </div>

              <Button
                onClick={() => setIsGenModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Auto-Schedule
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              {/* Week Headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-background">
                {calendarDays.map((day, idx) => {
                  const posts = getPostsForDay(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isTodayDate = isToday(day);

                  return (
                    <motion.div
                      key={day.toISOString()}
                      className={`min-h-[100px] border-b border-r border-border p-2 transition-colors relative group 
                        ${!isCurrentMonth && viewMode === 'month' ? "bg-muted/10 text-muted-foreground" : "text-foreground"}
                        ${isTodayDate ? "bg-primary/5" : "hover:bg-muted/5"}
                      `}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.005 }}
                    >
                      {/* Date Label */}
                      <div className={`text-xs font-semibold mb-2 flex justify-between items-center
                          ${isTodayDate ? "text-primary" : "text-muted-foreground"}
                        `}>
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? "bg-primary text-primary-foreground" : ""}`}>
                          {format(day, "d")}
                        </span>
                        {/* Add Post Button */}
                        <button
                          onClick={() => {
                            setQuickPostDate(day);
                            setQuickPostContent("");
                            setQuickPostTime("09:00");
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:bg-muted p-1 rounded transition-opacity"
                        >
                          <Plus className="w-3 h-3 text-primary" />
                        </button>
                      </div>

                      {/* Posts List */}
                      <div className="space-y-1.5 overflow-hidden max-h-[120px] overflow-y-auto scrollbar-none">
                        {posts.map(post => (
                          <DropdownMenu key={post._id}>
                            <DropdownMenuTrigger asChild>
                              <div className="text-[10px] p-1.5 rounded-md bg-card border border-border shadow-sm cursor-pointer hover:border-primary/50 transition-colors flex items-center gap-1.5 text-left group/post">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${post.posted ? "bg-green-500" : "bg-blue-500"}`} />
                                <span className="truncate flex-1 font-medium">{post.content}</span>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 text-xs">
                              <DropdownMenuItem disabled className="text-xs font-bold opacity-100 mb-1">
                                {format(new Date(post.scheduledAt), "h:mm a")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(post._id)} className="text-destructive">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Cancel Post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      <AnimatePresence>
        {isGenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Auto-Schedule Calendar
                  </h3>
                  <p className="text-sm text-muted-foreground">Generate a full month plan with AI</p>
                </div>
                <button onClick={() => setIsGenModalOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">What is this month's focus?</label>
                  <textarea
                    value={genFormData.topics}
                    onChange={e => setGenFormData({ ...genFormData, topics: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl p-3 text-sm min-h-[80px]"
                    placeholder="e.g., Launching our new SaaS features, Tips for React developers, Industry news..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Posts per Week</label>
                    <select
                      value={genFormData.frequency}
                      onChange={e => setGenFormData({ ...genFormData, frequency: Number(e.target.value) })}
                      className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm"
                    >
                      <option value={1}>1 Post / Week (4 total)</option>
                      <option value={3}>3 Posts / Week (12 total)</option>
                      <option value={5}>5 Posts / Week (20 total)</option>
                      <option value={7}>Daily (28-30 total)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Tone</label>
                    <select
                      value={genFormData.tone}
                      onChange={e => setGenFormData({ ...genFormData, tone: e.target.value })}
                      className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Casual">Casual & Fun</option>
                      <option value="Inspirational">Inspirational</option>
                      <option value="Educational">Educational</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={genLoading || !genFormData.topics.trim()}
                    className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl shadow-lg"
                  >
                    {genLoading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating Plan...</span> : "Generate Content Plan"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Post Modal */}
        {quickPostDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-muted/20 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-primary" />
                  Quick Schedule
                </h3>
                <button onClick={() => setQuickPostDate(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 p-2 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  {format(quickPostDate, "EEEE, MMMM do")}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Content</label>
                  <textarea
                    value={quickPostContent}
                    onChange={e => setQuickPostContent(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 min-h-[100px] text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                    placeholder="Write your post here..."
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</label>
                  <input
                    type="time"
                    value={quickPostTime}
                    onChange={e => setQuickPostTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setQuickPostDate(null)}>Cancel</Button>
                  <Button onClick={handleQuickPost} disabled={!quickPostContent.trim() || quickPostLoading} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    {quickPostLoading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                    Schedule Post
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
