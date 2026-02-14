"use client";

import React, { useState, useEffect } from "react";
import { Plus, MessageSquare, Clock, BarChart, Share2, Linkedin, Facebook, Instagram, Twitter, Bot, Play, Zap, Sparkles, Calendar, Image as ImageIcon, Import, FileText, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutomationList } from "@/components/automation-list";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PRESETS } from "@/lib/content-preset-store";

type UserPlan = "free" | "pro" | "enterprise";

interface SocialAccount {
  _id: string;
  platform: string;
  name: string;
  email: string;
  connected: boolean;
}

interface ScheduledPost {
  _id: string;
  content: string;
  scheduledAt: string;
  platform?: string;
  posted: boolean;
}

interface Automation {
  id: string;
  title: string;
  type: "content" | "response" | "analytics" | "crosspost" | "schedule";
  isActive: boolean;
  lastRun: string;
  icon: any;
  nextRun?: string;
  description?: string;
}

interface AutomationLog {
  id: number;
  run_at: string;
  automations_processed: number;
  status: string;
  error_details?: string;
}

export default function AutomationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showScheduleImport, setShowScheduleImport] = useState(false);

  // Form Items
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [postTime, setPostTime] = useState("09:00");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // New form fields
  const [preset, setPreset] = useState("");
  const [generateImage, setGenerateImage] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  const [userPlan, setUserPlan] = useState<UserPlan>("free");

  // Logs State
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch plan
  useEffect(() => {
    const email = session?.user?.email;
    if (email) {
      fetch(`/api/user/stats?email=${encodeURIComponent(email)}`).then(r => r.json()).then(d => setUserPlan(d.plan)).catch(() => { });
    }
  }, [session]);

  // Fetch accounts & list
  useEffect(() => {
    fetch("/api/social").then(r => r.json()).then(setConnectedAccounts).catch(() => { });
    fetchAutomations();
    fetchScheduledPosts();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      const mapped = data.map((a: any) => ({
        ...a,
        id: a._id,
        icon: getIcon(a.type),
        lastRun: a.lastRun ? new Date(a.lastRun).toLocaleString() : "Never",
        nextRun: a.nextRun ? new Date(a.nextRun).toLocaleString() : "Pending",
        description: a.type === "content" ? `${a.preset ? `[${PRESETS.find(p => p.id === a.preset)?.name || a.preset}] ` : ''}${a.topic} at ${a.postTime}` : "Automated task",
      }));
      setAutomations(mapped);
    } catch {
      toast.error("Failed to sync automations");
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      const res = await fetch('/api/schedule?mode=all');
      const data = await res.json();
      if (Array.isArray(data)) {
        setScheduledPosts(data.filter((p: ScheduledPost) => !p.posted));
      }
    } catch {
      console.error("Failed to fetch scheduled posts");
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    setIsLogsOpen(true);
    try {
      const res = await fetch("/api/automations/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      toast.error("Could not load execution logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "response": return MessageSquare;
      case "analytics": return BarChart;
      case "crosspost": return Share2;
      default: return Bot;
    }
  };

  const toggleAccount = (id: string) => setSelectedAccounts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleScheduleId = (id: string) => setSelectedScheduleIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic || selectedAccounts.length === 0) return toast.error("Please fill all required fields");

    setLoading(true);
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: "content",
          isActive: true,
          topic,
          postTime,
          tone,
          length,
          selectedAccounts,
          username,
          profileImageUrl,
          // New fields
          preset: preset || null,
          generateImage,
          frequency,
          importedScheduleIds: selectedScheduleIds,
        })
      });
      if (!res.ok) throw new Error();
      toast.success("Automation Created");
      setIsDialogOpen(false);
      resetForm();
      fetchAutomations();
    } catch {
      toast.error("Failed to create automation");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setTopic(""); setPostTime("09:00"); setTone("professional"); setLength("medium");
    setSelectedAccounts([]); setUsername(""); setProfileImageUrl("");
    setPreset(""); setGenerateImage(false); setFrequency("daily"); setSelectedScheduleIds([]);
    setShowScheduleImport(false);
  };

  const runAll = async () => {
    if (userPlan === 'free') return router.push("/billing");
    try {
      const res = await fetch('/api/run-automations');
      if (!res.ok) throw new Error();
      toast.success("Tasks queued successfully");
      fetchAutomations();
    } catch {
      toast.error("Failed to run");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          <div className="max-w-6xl mx-auto px-6 py-10">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />
                  Automations
                </h1>
                <p className="text-muted-foreground mt-1">Set your growth on autopilot with AI-powered content.</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={fetchLogs}
                  className="bg-card hover:bg-muted border-border"
                >
                  <FileText className="w-4 h-4 mr-2" /> Execution Logs
                </Button>
                <Button
                  onClick={runAll}
                  className="bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-border"
                >
                  <Play className="w-4 h-4 mr-2" /> Run Now
                </Button>
                <Button
                  onClick={() => userPlan === 'free' ? router.push("/billing") : setIsDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4 mr-2" /> New Automation
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <AutomationList
                  automations={automations}
                  setAutomations={setAutomations as any}
                  connectedAccounts={connectedAccounts}
                  fetchAutomations={fetchAutomations}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border border-border text-card-foreground p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-border bg-muted/50">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> Auto-Pilot Setup
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
            {/* Campaign Title */}
            <div className="space-y-2">
              <Label>Campaign Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Daily Tech News" className="bg-background border-input" />
            </div>

            {/* Content Strategy Section */}
            <div className="space-y-4 rounded-xl bg-muted/30 p-4 border border-border">
              <Label className="text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Content Strategy
              </Label>

              {/* Content Preset */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Content Style Preset</Label>
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="Select a content style..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground max-h-[200px]">
                    <SelectItem value="none">No specific style</SelectItem>
                    {PRESETS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Topic / Niche</Label>
                <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="What should the AI write about?" className="bg-background border-input min-h-[80px]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-background border-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="inspirational">Motivational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Length</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="bg-background border-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <p className="text-xs text-muted-foreground">Automatically create visuals for each post</p>
                </div>
              </div>
              <Switch checked={generateImage} onCheckedChange={setGenerateImage} />
            </div>

            {/* Schedule Settings */}
            <div className="space-y-4 rounded-xl bg-muted/30 p-4 border border-border">
              <Label className="text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" /> Schedule Settings
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Post Time (UTC)</Label>
                  <Input type="time" value={postTime} onChange={e => setPostTime(e.target.value)} className="bg-background border-input w-full" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="bg-background border-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekdays">Weekdays Only</SelectItem>
                      <SelectItem value="weekly">Weekly (Mondays)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Import from Schedule */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleImport(!showScheduleImport)}
                className="w-full flex items-center justify-center gap-2 border-dashed"
              >
                <Import className="w-4 h-4" />
                {showScheduleImport ? 'Hide' : 'Import from Scheduled Posts'}
                {selectedScheduleIds.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                    {selectedScheduleIds.length} selected
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {showScheduleImport && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-border rounded-xl p-3 bg-background/50 max-h-[200px] overflow-y-auto space-y-2">
                      {scheduledPosts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No scheduled posts available</p>
                      ) : (
                        scheduledPosts.map(post => (
                          <label
                            key={post._id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedScheduleIds.includes(post._id)
                              ? 'bg-primary/10 border-primary/50'
                              : 'bg-background border-border hover:bg-muted'
                              }`}
                          >
                            <Checkbox
                              checked={selectedScheduleIds.includes(post._id)}
                              onCheckedChange={() => toggleScheduleId(post._id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{post.content.substring(0, 60)}...</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.scheduledAt).toLocaleDateString()} at {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Target Platforms */}
            <div className="space-y-2">
              <Label>Target Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {connectedAccounts.map(acc => (
                  <label key={acc._id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAccounts.includes(acc._id) ? 'bg-primary/10 border-primary/50' : 'bg-background border-border hover:bg-muted'}`}>
                    <Checkbox checked={selectedAccounts.includes(acc._id)} onCheckedChange={() => toggleAccount(acc._id)} />
                    <span className="text-sm font-medium truncate">{acc.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/50 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? "Creating..." : "Launch Automation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="sm:max-w-3xl bg-card border border-border text-card-foreground p-0 overflow-hidden rounded-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="p-6 pb-2 border-b border-border bg-muted/50 shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Execution Logs
            </DialogTitle>
          </DialogHeader>

          <div className="p-0 overflow-y-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Processed</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No execution history found.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {new Date(log.run_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                            <XCircle className="w-3 h-3 mr-1" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {log.automations_processed} items
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate" title={log.error_details || "No errors"}>
                        {log.error_details ? (
                          <span className="flex items-center text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1" /> {log.error_details}
                          </span>
                        ) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}