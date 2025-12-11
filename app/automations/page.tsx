"use client";
import React, { useState, useEffect } from "react";
import { Plus, MessageSquare, Clock, BarChart, Share2, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutomationList } from "@/components/automation-list";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  linkedinId?: string;
}
interface Automation {
  id: string;
  title: string;
  type: "response" | "schedule" | "analytics" | "crosspost" | "content";
  isActive: boolean;
  lastRun: string;
  icon: any;
  topic?: string;
  postTime?: string; // "HH:mm"
  tone?: "professional" | "friendly" | "casual" | "inspirational";
  length?: "short" | "medium" | "long";
  selectedAccounts?: string[];
  nextRun?: string;
  count?: number;
  description?: string;
  automateImages?: boolean;
  username?: string;
  profileImageUrl?: string;
}
export default function AutomationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  // Form states
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [postTime, setPostTime] = useState("09:00");
  const [tone, setTone] = useState<"professional" | "friendly" | "casual" | "inspirational">("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [automateImages, setAutomateImages] = useState(false);
  const [username, setUsername] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  // Billing check
  const [userPlan, setUserPlan] = useState<UserPlan>("free");
  const userEmail = session?.user?.email || "guest@example.com";
  useEffect(() => {
    async function fetchUserStats() {
      try {
        const res = await fetch(`/api/user/stats?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error("Failed to fetch user stats");
        const data = await res.json();
        setUserPlan(data.plan || "free");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load user plan");
      }
    }
    if (userEmail) fetchUserStats();
  }, [userEmail]);
  useEffect(() => {
    fetch("/api/social")
      .then((res) => res.json())
      .then((data) => setConnectedAccounts(data))
      .catch((error) => console.error("Error fetching social accounts:", error));
  }, []);
  useEffect(() => {
    fetchAutomations();
  }, []);
  const fetchAutomations = async () => {
    try {
      const response = await fetch('/api/automations');
      if (!response.ok) {
        throw new Error('Failed to fetch automations');
      }
      const data = await response.json();
      const mapped = data.map((a: any) => ({
        ...a,
        id: a._id,
        icon: getIcon(a.type),
        lastRun: a.lastRun ? new Date(a.lastRun).toLocaleString() : "Never",
        nextRun: a.nextRun ? new Date(a.nextRun).toLocaleString() : "Unknown",
        description: a.type === "content" ? `Automated content daily at ${a.postTime} about ${a.topic}` : "",
      }));
      setAutomations(mapped);
    } catch (error) {
      toast.error("Failed to load automations");
    }
  };
  const getIcon = (type: string) => {
    switch (type) {
      case "response":
        return MessageSquare;
      case "schedule":
        return Clock;
      case "analytics":
        return BarChart;
      case "crosspost":
        return Share2;
      case "content":
        return Clock;
      default:
        return Clock;
    }
  };
  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic.trim() || selectedAccounts.length === 0 || !postTime) {
      toast.error("Missing fields: Please fill in all required fields.");
      return;
    }
    const newAutomation = {
      title,
      type: "content",
      isActive: true,
      lastRun: "Never",
      topic,
      postTime,
      tone,
      length,
      selectedAccounts,
      nextRun: new Date().toISOString(),
      count: 0,
      automateImages,
      username,
      profileImageUrl,
    };
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAutomation),
      });
      if (!response.ok) {
        throw new Error('Failed to create automation');
      }
      const savedAutomation = await response.json();
      const added = {
        ...savedAutomation,
        id: savedAutomation._id,
        icon: Clock,
        lastRun: "Never",
        nextRun: new Date(savedAutomation.nextRun).toLocaleString(),
        description: `Automated content daily at ${postTime} about ${topic}`,
      };
      setAutomations([...automations, added]);
      setIsDialogOpen(false);
      resetForm();
      toast.success("Automation created: Your new automation has been added.");
    } catch (error) {
      toast.error("Failed to create automation.");
    }
  };
  const resetForm = () => {
    setTitle("");
    setTopic("");
    setPostTime("09:00");
    setTone("professional");
    setLength("medium");
    setSelectedAccounts([]);
    setAutomateImages(false);
    setUsername("");
    setProfileImageUrl("");
  };
  const getPlatformLogo = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return Linkedin;
      case "x":
        return Twitter; // Using Twitter icon for X
      case "facebook":
        return Facebook;
      case "instagram":
        return Instagram;
      default:
        return null;
    }
  };
  const handleCreateClick = () => {
    if (userPlan === "free") {
      toast.error("Upgrade to a paid plan to create automations!");
      router.push("/billing");
    } else {
      setIsDialogOpen(true);
    }
  };
  return (
    <div className="min-h-screen bg-[#0F1116] text-white flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-yellow-400 bg-clip-text text-transparent">
                Automations
              </h2>
              <p className="text-gray-400 mt-1 text-xs sm:text-base max-w-xs sm:max-w-full">
                Create and manage automated workflows for your social accounts.
              </p>
            </div>
            {/* Create Button */}
            <Button
              onClick={handleCreateClick}
              className="
                bg-gradient-to-r from-blue-500 to-yellow-500 text-white
                hover:from-blue-600 hover:to-yellow-600
                px-4 sm:px-5 h-10 rounded-xl
                w-full sm:w-auto shadow-lg
              "
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </div>
          {/* Automation List */}
          <div className="mt-8 grid gap-6">
            <div className="bg-[#1E1F25] border border-[#2E3038] rounded-2xl p-4 sm:p-5 shadow-lg">
              <AutomationList automations={automations} setAutomations={setAutomations} connectedAccounts={connectedAccounts} fetchAutomations={fetchAutomations} />
            </div>
          </div>
        </motion.div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#1A1B22] border border-[#2A2A35] text-white overflow-y-auto max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-500 to-yellow-400 bg-clip-text text-transparent">Create New Automation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#14151B] border-[#2A2A35] text-white focus:border-blue-400"
                placeholder="e.g., Daily AI Tips"
              />
            </div>
            <div>
              <Label htmlFor="topic">Topic or Niche Description *</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-[#14151B] border-[#2A2A35] text-white focus:border-yellow-400"
                placeholder="Describe your topic or niche (e.g., AI tools for resumes, tech careers)"
              />
            </div>
            <div>
              <Label htmlFor="postTime">Post Time (daily at HH:mm UTC) *</Label>
              <Input
                id="postTime"
                type="time"
                value={postTime}
                onChange={(e) => setPostTime(e.target.value)}
                className="bg-[#14151B] border-[#2A2A35] text-white focus:border-blue-400"
              />
            </div>
            <div>
              <Label>Tone *</Label>
              <Select value={tone} onValueChange={(val) => setTone(val as any)}>
                <SelectTrigger className="bg-[#14151B] border-[#2A2A35] text-white focus:border-yellow-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1B22] border-[#2A2A35] text-white">
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Length *</Label>
              <Select value={length} onValueChange={(val) => setLength(val as any)}>
                <SelectTrigger className="bg-[#14151B] border-[#2A2A35] text-white focus:border-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1B22] border-[#2A2A35] text-white">
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Connected Accounts *</Label>
              <div className="space-y-2 mt-2">
                {connectedAccounts.length === 0 ? (
                  <p className="text-gray-400 text-sm">No connected accounts. Please connect in settings.</p>
                ) : (
                  connectedAccounts.map((account) => {
                    const Logo = getPlatformLogo(account.platform);
                    return (
                      <div key={account._id} className="flex items-center gap-2">
                        <Checkbox
                          id={account._id}
                          checked={selectedAccounts.includes(account._id)}
                          onCheckedChange={() => toggleAccount(account._id)}
                        />
                        <Label htmlFor={account._id} className="flex items-center gap-2 text-blue-300">
                          {Logo && <Logo className="h-4 w-4 text-yellow-400" />}
                          <span>{account.name}</span>
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div>
              <Label>Automate Images</Label>
              <Select value={automateImages ? 'yes' : 'no'} onValueChange={(val) => setAutomateImages(val === 'yes')}>
                <SelectTrigger className="bg-[#14151B] border-[#2A2A35] text-white focus:border-blue-400 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1B22] border-[#2A2A35] text-white">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {automateImages && (
              <>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#14151B] border-[#2A2A35] text-white focus:border-blue-400"
                    placeholder="e.g., Michael James"
                  />
                </div>
                <div>
                  <Label htmlFor="profileImage">Profile Image *</Label>
                  {profileImageUrl && (
                    <img
                      src={profileImageUrl}
                      alt="Profile Preview"
                      className="w-20 h-20 rounded-full mb-2"
                    />
                  )}
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-[#14151B] border-[#2A2A35] text-white focus:border-blue-400"
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                className="flex-1 border-blue-400 text-blue-400 hover:bg-blue-400/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-yellow-500 text-white hover:from-blue-600 hover:to-yellow-600"
              >
                Automate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}