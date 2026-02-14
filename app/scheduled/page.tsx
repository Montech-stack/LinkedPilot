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
  AlertCircle,
  Image as ImageIcon,
  TrendingUp,
  Zap,
  BarChart3,
  Target,
  Layers,
  Users,
  Pencil
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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
    platform: "LinkedIn",
    generateImage: false
  });

  // Quick Post State
  const [quickPostDate, setQuickPostDate] = useState<Date | null>(null);
  const [quickPostContent, setQuickPostContent] = useState("");
  const [quickPostTime, setQuickPostTime] = useState("09:00");
  const [quickPostLoading, setQuickPostLoading] = useState(false);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?mode=all`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setScheduledPosts(data);
      } else {
        setScheduledPosts([]);
        console.error("Expected array from /api/schedule, got:", data);
      }
    } catch (error) {
      toast.error("Failed to load schedule");
      setScheduledPosts([]);
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
          platform: genFormData.platform,
          startDate: format(new Date(), "yyyy-MM-dd"),
          generateImage: genFormData.generateImage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(`Generated ${data.count} posts!`);
      setIsGenModalOpen(false);
      setGenFormData({
        topics: "",
        frequency: 3,
        platform: "LinkedIn",
        generateImage: false
      });
      fetchScheduled();
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
      const dateStr = format(quickPostDate, "yyyy-MM-dd");
      const dateTime = new Date(`${dateStr}T${quickPostTime}:00`);

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: quickPostContent,
          scheduledAt: dateTime,
          platform: "linkedin",
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

  const openEditModal = (post: any) => {
    const date = new Date(post.scheduledAt);
    setEditContent(post.content);
    setEditDate(format(date, "yyyy-MM-dd"));
    setEditTime(format(date, "HH:mm"));
    setEditingPost(post);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    if (!editContent.trim()) return toast.error("Content required");

    setIsEditSaving(true);
    try {
      const dateTime = new Date(`${editDate}T${editTime}:00`);

      const res = await fetch(`/api/schedule/${editingPost._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          scheduledAt: dateTime
        })
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Post updated!");
      setEditingPost(null);
      fetchScheduled();
    } catch (e) {
      toast.error("Failed to update post");
    } finally {
      setIsEditSaving(false);
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

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
            <div className="flex flex-col xl:flex-row items-center justify-between mb-6 gap-6">
              <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 py-1 text-center lg:text-left">
                  Content Calendar
                </h1>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto justify-center">
                  <div className="flex items-center bg-muted rounded-lg p-1 border border-border shrink-0">
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

                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-border shrink-0">
                    <button onClick={prevPeriod} className="p-1 hover:bg-background rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
                    <button onClick={goToToday} className="px-3 py-1 text-sm font-semibold hover:bg-background rounded-md transition-colors min-w-[100px] text-center">
                      {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week' MMM d")}
                    </button>
                    <button onClick={nextPeriod} className="p-1 hover:bg-background rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setIsGenModalOpen(true)}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Auto-Schedule
              </Button>
            </div>

            {/* Calendar Grid & Insights Wrapper */}
            <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
              {/* Calendar Grid */}
              <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[600px] overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                  </div>

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
                          <div className={`text-xs font-semibold mb-2 flex justify-between items-center
                          ${isTodayDate ? "text-primary" : "text-muted-foreground"}
                        `}>
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate ? "bg-primary text-primary-foreground" : ""}`}>
                              {format(day, "d")}
                            </span>
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
                                  <DropdownMenuItem onClick={() => openEditModal(post)}>
                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit Post
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

              {/* Smart Insights Panel */}
              <div className="w-full xl:w-80 shrink-0 space-y-6 overflow-y-auto pr-2 pb-2">
                {/* Strategy Score Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Sparkles className="w-12 h-12 text-violet-500" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">Strategy Score</h3>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-4xl font-extrabold text-violet-600 dark:text-violet-400">92</span>
                      <span className="text-sm text-green-500 font-semibold mb-1.5 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> +4%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 w-[92%] rounded-full" />
                    </div>
                    <p className="text-xs text-muted-foreground">Great work! You're posting consistently.</p>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Posts Ready</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {scheduledPosts.filter(p => new Date(p.scheduledAt) > new Date()).length}
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Est. Reach</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      2.4k
                      <Users className="w-4 h-4 text-blue-500" />
                    </p>
                  </div>
                </div>

                {/* Best Times */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Best Times to Post
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      { day: "Today", time: "2:00 PM", score: "High" },
                      { day: "Tomorrow", time: "9:00 AM", score: "Peak" },
                      { day: "Wed", time: "5:00 PM", score: "Good" },
                    ].map((slot, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground w-20">{slot.day}</span>
                        <span className="font-medium bg-muted px-2 py-0.5 rounded text-xs">{slot.time}</span>
                        <span className={`text-xs font-semibold ${slot.score === 'Peak' ? 'text-green-500' : 'text-blue-500'}`}>
                          {slot.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Mix - Matching Demo Presets */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      Content Mix
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Educational", val: 40, color: "bg-blue-500" },
                      { label: "Personal Story", val: 30, color: "bg-pink-500" },
                      { label: "Promotional", val: 10, color: "bg-emerald-500" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{item.label}</span>
                          <span className="text-muted-foreground">{item.val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary h-8">
                      View Full Analytics
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generator Modal - Enhanced */}
      <AnimatePresence>
        {isGenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-[95%] sm:w-full max-w-xl rounded-2xl border border-border shadow-2xl overflow-hidden mx-auto my-auto"
            >
              <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Auto-Schedule
                  </h3>
                  <p className="text-sm text-muted-foreground">Generate a full month of content with AI</p>
                </div>
                <button onClick={() => setIsGenModalOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Content Style Preset */}


                {/* Topic */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">What is this month's focus?</Label>
                  <textarea
                    value={genFormData.topics}
                    onChange={e => setGenFormData({ ...genFormData, topics: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl p-3 text-sm min-h-[80px] focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g., Launching our new SaaS features, Tips for React developers, Industry news..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Platform</Label>
                    <Select value={genFormData.platform} onValueChange={(value) => setGenFormData({ ...genFormData, platform: value })}>
                      <SelectTrigger className="w-full bg-background border-input h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="LinkedIn" className="py-2.5">LinkedIn</SelectItem>
                        <SelectItem value="Twitter" className="py-2.5">Twitter / X</SelectItem>
                        <SelectItem value="Instagram" className="py-2.5">Instagram</SelectItem>
                        <SelectItem value="Facebook" className="py-2.5">Facebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Posts per Week</Label>
                    <Select value={String(genFormData.frequency)} onValueChange={(value) => setGenFormData({ ...genFormData, frequency: Number(value) })}>
                      <SelectTrigger className="w-full bg-background border-input h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="1" className="py-2.5">1 Post / Week (4 total)</SelectItem>
                        <SelectItem value="3" className="py-2.5">3 Posts / Week (12 total)</SelectItem>
                        <SelectItem value="5" className="py-2.5">5 Posts / Week (20 total)</SelectItem>
                        <SelectItem value="7" className="py-2.5">Daily (28-30 total)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>



                {/* Image Generation Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <Label className="font-medium">Generate AI Images</Label>
                      <p className="text-xs text-muted-foreground">Create visuals for each post</p>
                    </div>
                  </div>
                  <Switch
                    checked={genFormData.generateImage}
                    onCheckedChange={(checked) => setGenFormData({ ...genFormData, generateImage: checked })}
                  />
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
              className="bg-card w-[95%] sm:w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden mx-auto"
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

        {/* Edit Post Modal */}
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-[95%] sm:w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden mx-auto"
            >
              <div className="p-5 border-b border-border bg-muted/20 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" />
                  Edit Post
                </h3>
                <button onClick={() => setEditingPost(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Content</label>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 min-h-[100px] text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                    placeholder="Write your post here..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={e => setEditTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditingPost(null)}>Cancel</Button>
                  <Button onClick={handleUpdatePost} disabled={!editContent.trim() || isEditSaving} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    {isEditSaving && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                    Save Changes
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
