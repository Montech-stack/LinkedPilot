"use client";

import React, { useState, useEffect } from "react";
import { Plus, MessageSquare, Clock, BarChart, Share2, Linkedin, Facebook, Instagram, Twitter, Bot, Play, Zap } from "lucide-react";
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
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type UserPlan = "free" | "pro" | "enterprise";

interface SocialAccount {
  _id: string;
  platform: string;
  name: string;
  email: string;
  connected: boolean;
}

interface Automation {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  lastRun: string;
  icon: any;
  nextRun?: string;
  description?: string;
}

export default function AutomationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);

  // Form Items
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [postTime, setPostTime] = useState("09:00");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [automateImages, setAutomateImages] = useState(false);
  const [username, setUsername] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [userPlan, setUserPlan] = useState<UserPlan>("free");

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
        description: a.type === "content" ? `Daily post about ${a.topic} at ${a.postTime}` : "Automated task",
      }));
      setAutomations(mapped);
    } catch {
      toast.error("Failed to sync automations");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic || selectedAccounts.length === 0) return toast.error("Please fill all required fields");

    setLoading(true);
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, type: "content", isActive: true, topic, postTime, tone, length, selectedAccounts, automateImages, username, profileImageUrl
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
    setSelectedAccounts([]); setAutomateImages(false); setUsername(""); setProfileImageUrl("");
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
                <p className="text-muted-foreground mt-1">Set your growth on autopilot.</p>
              </div>

              <div className="flex gap-3">
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
                  setAutomations={setAutomations as any} // Typing loose for now
                  connectedAccounts={connectedAccounts}
                  fetchAutomations={fetchAutomations}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-card border border-border text-card-foreground p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-border bg-muted/50">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" /> Auto-Pilot Setup
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
            <div className="space-y-2">
              <Label>Campaign Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Daily Tech News" className="bg-background border-input" />
            </div>

            <div className="space-y-4 rounded-xl bg-muted/30 p-4 border border-border">
              <Label className="text-primary">Content Strategy</Label>
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

            <div className="space-y-2">
              <Label>Schedule (UTC)</Label>
              <Input type="time" value={postTime} onChange={e => setPostTime(e.target.value)} className="bg-background border-input w-full" />
            </div>

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
    </div>
  );
}