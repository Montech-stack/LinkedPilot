"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, Edit3, Trash2, Play, Pause, Eye, EyeOff, Repeat, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"

// Mock data for scheduled posts
const mockScheduledPosts = [
  {
    id: 1,
    content:
      "🚀 Excited to share our latest product update! We've been working tirelessly to improve user experience and I'm thrilled with the results. The new dashboard reduces load times by 60% and includes several user-requested features. What's the most impactful product update you've experienced recently? Would love to hear your thoughts! #ProductDevelopment #UserExperience #TechInnovation",
    scheduledDate: "Aug 2, 2025",
    scheduledTime: "2:00 PM",
    status: "scheduled",
    type: "once",
    recurring: null,
  },
  {
    id: 2,
    content:
      "💡 Here's a productivity tip that changed my workflow completely. Time blocking isn't just about scheduling meetings - it's about protecting your deep work time. I now block 2-hour chunks for focused work and it's been a game changer. The key is treating these blocks as seriously as you would any important meeting. What productivity strategies have worked best for you?",
    scheduledDate: "Every Monday",
    scheduledTime: "10:30 AM",
    status: "scheduled",
    type: "recurring",
    recurring: "weekly",
  },
  {
    id: 3,
    content:
      "🎯 The biggest mistake I see professionals make on LinkedIn is treating it like other social media platforms. LinkedIn isn't about posting random thoughts - it's about sharing valuable insights that help your network grow professionally. Every post should either educate, inspire, or start meaningful conversations. Quality over quantity, always.",
    scheduledDate: "Aug 4, 2025",
    scheduledTime: "3:15 PM",
    status: "paused",
    type: "once",
    recurring: null,
  },
]

export default function ScheduledPosts() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [posts, setPosts] = useState(mockScheduledPosts)
  const [editingPost, setEditingPost] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editRecurring, setEditRecurring] = useState("")
  const [expandedPost, setExpandedPost] = useState<number | null>(null)
  const [showAutoSchedule, setShowAutoSchedule] = useState(false)
  const [autoScheduleSettings, setAutoScheduleSettings] = useState({
    frequency: "daily",
    time: "14:00",
    enabled: false,
  })

  const deletePost = (id: number) => {
    setPosts(posts.filter((post) => post.id !== id))
  }

  const toggleStatus = (id: number) => {
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, status: post.status === "scheduled" ? "paused" : "scheduled" } : post,
      ),
    )
  }

  const startEditing = (post: any) => {
    setEditingPost(post.id)
    setEditContent(post.content)
    setEditDate(post.type === "once" ? post.scheduledDate : "")
    setEditTime(post.scheduledTime)
    setEditRecurring(post.recurring || "")
  }

  const saveEdit = () => {
    setPosts(
      posts.map((post) =>
        post.id === editingPost
          ? {
              ...post,
              content: editContent,
              scheduledDate: post.type === "once" ? editDate : post.scheduledDate,
              scheduledTime: editTime,
              recurring: editRecurring || post.recurring,
            }
          : post,
      ),
    )
    setEditingPost(null)
  }

  const cancelEdit = () => {
    setEditingPost(null)
    setEditContent("")
    setEditDate("")
    setEditTime("")
    setEditRecurring("")
  }

  const toggleAutoSchedule = () => {
    setAutoScheduleSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 gradient-text">Scheduled Posts</h1>
            <p className="text-gray-400 text-lg">Manage your upcoming LinkedIn posts and their publishing schedule</p>
          </motion.div>

          {/* Auto Schedule Settings */}
          <motion.div
            className="gradient-card rounded-xl p-6 mb-8 border border-[#2d3748] shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Auto Schedule</h2>
                  <p className="text-gray-400 text-sm">Automatically schedule posts at regular intervals</p>
                </div>
              </div>
              <Button
                onClick={toggleAutoSchedule}
                className={`${
                  autoScheduleSettings.enabled
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : "bg-gradient-to-r from-[#0077B5] to-[#00A0DC]"
                } hover:opacity-90 text-white shadow-lg`}
              >
                {autoScheduleSettings.enabled ? "Enabled" : "Enable Auto Schedule"}
              </Button>
            </div>

            {autoScheduleSettings.enabled && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <Select
                    value={autoScheduleSettings.frequency}
                    onValueChange={(value) => setAutoScheduleSettings((prev) => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger className="bg-[#0a0b0f] border-[#2d3748] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d29] border-[#2d3748]">
                      <SelectItem value="daily" className="text-white hover:bg-[#2d3748]">
                        Daily
                      </SelectItem>
                      <SelectItem value="weekly" className="text-white hover:bg-[#2d3748]">
                        Weekly
                      </SelectItem>
                      <SelectItem value="monthly" className="text-white hover:bg-[#2d3748]">
                        Monthly
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={autoScheduleSettings.time}
                    onChange={(e) => setAutoScheduleSettings((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-[#0a0b0f] border border-[#2d3748] rounded-lg px-3 py-2 text-white focus:border-[#0077B5] focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full border-[#2d3748] text-gray-300 hover:bg-[#2d3748] bg-transparent"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-[#0077B5]" />
                <div>
                  <div className="text-2xl font-bold">{posts.filter((p) => p.status === "scheduled").length}</div>
                  <div className="text-gray-400 text-sm">Scheduled</div>
                </div>
              </div>
            </div>
            <div className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-lg">
              <div className="flex items-center gap-3">
                <Pause className="w-8 h-8 text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">{posts.filter((p) => p.status === "paused").length}</div>
                  <div className="text-gray-400 text-sm">Paused</div>
                </div>
              </div>
            </div>
            <div className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-lg">
              <div className="flex items-center gap-3">
                <Repeat className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold">{posts.filter((p) => p.type === "recurring").length}</div>
                  <div className="text-gray-400 text-sm">Recurring</div>
                </div>
              </div>
            </div>
            <div className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold">7</div>
                  <div className="text-gray-400 text-sm">This Week</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scheduled Posts List */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                {/* Post Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{post.scheduledDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{post.scheduledTime}</span>
                    </div>
                    {post.type === "recurring" && (
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400 capitalize">{post.recurring}</span>
                      </div>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        post.status === "scheduled"
                          ? "bg-[#0077B5] bg-opacity-20 text-[#0077B5] border-[#0077B5]/20"
                          : "bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500/20"
                      }`}
                    >
                      {post.status === "scheduled" ? "Scheduled" : "Paused"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="text-gray-400 hover:text-white hover:bg-[#2d3748]"
                    >
                      {expandedPost === post.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStatus(post.id)}
                      className="text-gray-400 hover:text-white hover:bg-[#2d3748]"
                    >
                      {post.status === "scheduled" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(post)}
                      className="text-gray-400 hover:text-white hover:bg-[#2d3748]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePost(post.id)}
                      className="text-gray-400 hover:text-red-400 hover:bg-[#2d3748]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Post Content */}
                {editingPost === post.id ? (
                  <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[150px] bg-[#0a0b0f] border-[#2d3748] text-white resize-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {post.type === "once" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full bg-[#0a0b0f] border border-[#2d3748] rounded-lg px-3 py-2 text-white focus:border-[#0077B5] focus:outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-2">Time</label>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full bg-[#0a0b0f] border border-[#2d3748] rounded-lg px-3 py-2 text-white focus:border-[#0077B5] focus:outline-none"
                        />
                      </div>
                      {post.type === "recurring" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Frequency</label>
                          <Select value={editRecurring} onValueChange={setEditRecurring}>
                            <SelectTrigger className="bg-[#0a0b0f] border-[#2d3748] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1d29] border-[#2d3748]">
                              <SelectItem value="daily" className="text-white hover:bg-[#2d3748]">
                                Daily
                              </SelectItem>
                              <SelectItem value="weekly" className="text-white hover:bg-[#2d3748]">
                                Weekly
                              </SelectItem>
                              <SelectItem value="monthly" className="text-white hover:bg-[#2d3748]">
                                Monthly
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={saveEdit}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="outline"
                        className="border-[#2d3748] text-gray-300 hover:bg-[#2d3748] bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-gray-300 leading-relaxed">
                    {expandedPost === post.id ? (
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    ) : (
                      <p className="line-clamp-3">{post.content}</p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {posts.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No scheduled posts</h3>
              <p className="text-gray-400 mb-6">Schedule your first post to see it here</p>
              <Button className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg">
                Schedule a post
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
