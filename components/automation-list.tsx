"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pause, Play, Edit, Trash, Cloud, Zap, Clock, Share2, MessageSquare, Linkedin, Twitter, Facebook, Instagram } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  postTime?: string
  tone?: "professional" | "friendly" | "casual" | "inspirational"
  length?: "short" | "medium" | "long"
  selectedAccounts?: string[]
  nextRun?: string
  count?: number
  automateImages?: boolean;
  username?: string;
  profileImageUrl?: string;
}

export function AutomationList({ automations, setAutomations, connectedAccounts, fetchAutomations }: { automations: Automation[], setAutomations: React.Dispatch<React.SetStateAction<Automation[]>>, connectedAccounts: SocialAccount[], fetchAutomations: () => void }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAuto, setEditingAuto] = useState<Automation | null>(null)
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [postTime, setPostTime] = useState("09:00")
  const [tone, setTone] = useState<any>("professional")
  const [length, setLength] = useState<any>("medium")
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [automateImages, setAutomateImages] = useState(false);
  const [username, setUsername] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const toggleAutomation = async (id: string) => {
    const auto = automations.find(a => a.id === id)
    if (!auto) return
    const newActive = !auto.isActive
    try {
      await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: newActive }),
      });
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: newActive } : a));
      toast.success(newActive ? "Automation Resumed" : "Automation Paused");
    } catch {
      toast.error("Failed to update");
    }
  }

  const deleteAutomation = async (id: string) => {
    try {
      await fetch('/api/automations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setAutomations((prev) => prev.filter((auto) => auto.id !== id))
      toast.success("Deleted successfully")
    } catch {
      toast.error("Failed to delete")
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
    setAutomateImages(auto.automateImages || false);
    setUsername(auto.username || "");
    setProfileImageUrl(auto.profileImageUrl || "");
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAuto) return

    const updates = {
      id: editingAuto.id,
      title, topic, postTime, tone, length, selectedAccounts, automateImages,
      username: automateImages ? username : null,
      profileImageUrl: automateImages ? profileImageUrl : null,
    }

    try {
      const res = await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error();

      const updated = await res.json()
      setAutomations(prev => prev.map(a => a.id === editingAuto.id ? {
        ...a, ...updates,
        description: `Daily post about ${topic}`,
        nextRun: updated.nextRun ? new Date(updated.nextRun).toLocaleString() : "Pending"
      } : a));

      setEditDialogOpen(false)
      toast.success("Configuration updated")
    } catch {
      toast.error("Update failed")
    }
  }

  const toggleAccount = (id: string) => setSelectedAccounts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const getPlatformLogo = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin": return Linkedin
      case "x": return Twitter
      case "facebook": return Facebook
      case "instagram": return Instagram
      default: return Cloud
    }
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {automations.map((automation) => (
          <Card
            key={automation.id}
            className="bg-card border border-border rounded-xl transition-all duration-300 hover:border-primary/50 group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${automation.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-foreground font-medium line-clamp-1">{automation.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{automation.isActive ? 'Running' : 'Paused'}</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                    <DropdownMenuItem onClick={() => toggleAutomation(automation.id)}>
                      {automation.isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {automation.isActive ? "Pause" : "Resume"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(automation)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteAutomation(automation.id)} className="text-red-400 hover:text-red-300 focus:text-red-300">
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-blue-500/20 text-blue-400 capitalize">
                    {automation.tone}
                  </Badge>
                  {automation.length && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-purple-500/20 text-purple-400 capitalize">
                      {automation.length}
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-2">{automation.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {automation.postTime} UTC
                  </div>
                  {/* Platform Icons */}
                  <div className="flex -space-x-1.5">
                    {connectedAccounts.filter(acc => automation.selectedAccounts?.includes(acc._id)).map((acc, i) => {
                      const Icon = getPlatformLogo(acc.platform);
                      return (
                        <div key={acc._id} className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center relative z-10" style={{ zIndex: 10 - i }}>
                          <Icon className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-foreground">{automation.count || 0}</span> runs
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {automations.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Cloud className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No active automations found.</p>
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-2 bg-muted border-b border-border">
            <DialogTitle className="text-lg">Edit Configuration</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-muted/50 border-border" />
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Textarea value={topic} onChange={e => setTopic(e.target.value)} className="bg-muted/50 border-border min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Time (UTC)</Label><Input type="time" value={postTime} onChange={e => setPostTime(e.target.value)} className="bg-muted/50 border-border" /></div>
              <div><Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Connected Accounts</Label>
              <div className="grid grid-cols-2 gap-2">
                {connectedAccounts.map(acc => (
                  <div key={acc._id} className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
                    <Checkbox checked={selectedAccounts.includes(acc._id)} onCheckedChange={() => toggleAccount(acc._id)} />
                    <span className="text-xs truncate">{acc.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}