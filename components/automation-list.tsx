"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pause, Play, Edit, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { MessageSquare, Linkedin,Twitter,Facebook, Instagram, Clock, BarChart, Share2 } from "lucide-react"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface SocialAccount {
  _id: string;
  platform: string;
  name: string;
  email: string;
  connected: boolean;
  linkedinId?: string;
}

interface Automation {
  id: string
  title: string
  description?: string
  type: "response" | "schedule" | "analytics" | "crosspost" | "content"
  isActive: boolean
  lastRun: string
  icon: any
  topic?: string
  postTime?: string // "HH:mm"
  tone?: "professional" | "friendly" | "casual" | "inspirational"
  length?: "short" | "medium" | "long"
  selectedAccounts?: string[]
  nextRun?: string
  count?: number
}

export function AutomationList({ automations, setAutomations, connectedAccounts, fetchAutomations }: { automations: Automation[], setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>, connectedAccounts: SocialAccount[], fetchAutomations: () => void }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAuto, setEditingAuto] = useState<Automation | null>(null)
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [postTime, setPostTime] = useState("09:00")
  const [tone, setTone] = useState<"professional" | "friendly" | "casual" | "inspirational">("professional")
  const [length, setLength] = useState<"short" | "medium" | "long">("medium")
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  const toggleAutomation = async (id: string) => {
    const auto = automations.find(a => a.id === id)
    if (!auto) return
    const newActive = !auto.isActive

    try {
      const response = await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: newActive }),
      })
      if (!response.ok) {
        throw new Error('Failed to update automation')
      }
      setAutomations((prev) =>
        prev.map((auto) =>
          auto.id === id ? { ...auto, isActive: newActive } : auto
        )
      )
      toast.success(`Automation ${newActive ? 'resumed' : 'paused'}`)
    } catch (error) {
      toast.error("Failed to update automation")
    }
  }

  const deleteAutomation = async (id: string) => {
    try {
      const response = await fetch('/api/automations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) {
        throw new Error('Failed to delete automation')
      }
      setAutomations((prev) => prev.filter((auto) => auto.id !== id))
      toast.success("Automation deleted")
    } catch (error) {
      toast.error("Failed to delete automation")
    }
  }

  const openEdit = (auto: Automation) => {
    setEditingAuto(auto)
    setTitle(auto.title)
    setTopic(auto.topic || "")
    setPostTime(auto.postTime || "09:00")
    setTone(auto.tone || "professional")
    setLength(auto.length || "medium")
    setSelectedAccounts(auto.selectedAccounts || [])
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAuto || !title || !topic.trim() || selectedAccounts.length === 0 || !postTime) {
      toast.error("Missing fields")
      return
    }

    const updates = {
      id: editingAuto.id,
      title,
      topic,
      postTime,
      tone,
      length,
      selectedAccounts,
    }

    try {
      const response = await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update automation')
      }
      const updated = await response.json()
      setAutomations((prev) =>
        prev.map((auto) =>
          auto.id === editingAuto.id ? { ...auto, ...updates, description: `Automated content daily at ${postTime} about ${topic}`, nextRun: updated.nextRun ? new Date(updated.nextRun).toLocaleString() : "Unknown" } : auto
        )
      )
      setEditDialogOpen(false)
      toast.success("Automation updated")
    } catch (error) {
      toast.error("Failed to update automation")
    }
  }

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const getPlatformLogo = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return Linkedin
      case "x":
        return Twitter
      case "facebook":
        return Facebook
      case "instagram":
        return Instagram
      default:
        return null
    }
  }

  return (
    <>
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {automations.map((automation) => (
        <Card
          key={automation.id}
          className="flex flex-col border border-[#2A2A35] bg-[#14151B] rounded-2xl 
          shadow-[0_0_15px_rgba(0,0,0,0.4)]
          hover:shadow-[0_0_25px_rgba(0,114,255,0.35),0_0_45px_rgba(255,215,0,0.25)]
          transition-all duration-300"
        >
          {/* HEADER */}
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex items-center gap-3">
              {/* ACTIVE BADGE */}
              <Badge
                className={
                  automation.isActive
                    ? "bg-gradient-to-r from-[#0072FF] to-[#FFD700] text-black font-semibold shadow-md"
                    : "bg-gray-700 text-gray-300"
                }
              >
                {automation.isActive ? "Active" : "Paused"}
              </Badge>
            {/* MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-300" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="bg-[#1A1B22] border border-[#2A2A35]"
              >
                <DropdownMenuItem
                  onClick={() => toggleAutomation(automation.id)}
                  className="text-white"
                >
                  {automation.isActive ? (
                    <Pause className="mr-2 h-4 w-4 text-[#FFD700]" />
                  ) : (
                    <Play className="mr-2 h-4 w-4 text-[#0072FF]" />
                  )}
                  {automation.isActive ? "Pause" : "Resume"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openEdit(automation)} className="text-white">
                  <Edit className="mr-2 h-4 w-4 text-[#0072FF]" />
                  Edit Configuration
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => deleteAutomation(automation.id)} className="text-red-400">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>

          </CardHeader>

          {/* CONTENT */}
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-white line-clamp-1">{automation.title}</CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-1 line-clamp-2">
                {automation.description}
              </CardDescription>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              {automation.postTime && <p>Post time: Daily at {automation.postTime}</p>}
              {automation.nextRun && <p>Next run: {automation.nextRun}</p>}
              {automation.count !== undefined && <p>Posts created: {automation.count}</p>}
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#2A2A35]">
              <span className="text-xs text-gray-500">
                Last run: {automation.lastRun}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Edit Dialog */}
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className="sm:max-w-[600px] bg-[#1A1B22] border border-[#2A2A35] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-500 to-yellow-400 bg-clip-text text-transparent">Edit Automation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
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
                <p className="text-gray-400 text-sm">No connected accounts.</p>
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

          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1 border-blue-400 text-blue-400 hover:bg-blue-400/20">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-yellow-500 text-white hover:from-blue-600 hover:to-yellow-600">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}