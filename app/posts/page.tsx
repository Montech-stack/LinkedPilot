"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, RefreshCw, Calendar, Copy, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    date: "Jul 30, 2025",
    content:
      "🚀 Just shipped a game-changing feature that reduces load times by 60%! The journey wasn't easy - 3 weeks of debugging, countless coffee cups, and moments of doubt. But here's what I learned: Every 'impossible' problem has a solution waiting to be discovered. What's the most challenging technical problem you've solved recently? 👇",
    preview:
      "🚀 Just shipped a game-changing feature that reduces load times by 60%! The journey wasn't easy - 3 weeks of debugging...",
  },
  {
    id: 2,
    date: "Jul 29, 2025",
    content:
      "💡 The best career advice I wish I knew 5 years ago: Your network is your net worth, but authenticity is your currency. Stop trying to impress everyone and start being genuinely helpful. Share knowledge, celebrate others' wins, and ask thoughtful questions. The opportunities will follow naturally. What's one piece of career advice that changed your trajectory?",
    preview:
      "💡 The best career advice I wish I knew 5 years ago: Your network is your net worth, but authenticity is your currency...",
  },
  {
    id: 3,
    date: "Jul 28, 2025",
    content:
      "🎯 Unpopular opinion: Most productivity hacks are just procrastination in disguise. I spent years optimizing my workflow instead of actually working. The real game-changer? Time blocking and saying no to everything that doesn't align with my top 3 priorities. Simple beats complex every time. What's your most effective productivity strategy?",
    preview:
      "🎯 Unpopular opinion: Most productivity hacks are just procrastination in disguise. I spent years optimizing my workflow...",
  },
]

export default function PostsLibrary() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedPost, setExpandedPost] = useState<number | null>(null)
  const [posts, setPosts] = useState(mockPosts)

  const filteredPosts = posts.filter((post) => post.content.toLowerCase().includes(searchQuery.toLowerCase()))

  const copyPost = (content: string) => {
    navigator.clipboard.writeText(content)
    // Add toast notification here
  }

  const deletePost = (id: number) => {
    setPosts(posts.filter((post) => post.id !== id))
  }

  const toggleExpand = (id: number) => {
    setExpandedPost(expandedPost === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 max-w-4xl mx-auto">
          {/* Header */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold mb-2">Posts Library</h1>
            <p className="text-gray-400">Browse, search, and manage all your AI-generated content in one place</p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            className="bg-[#2d3748] rounded-xl p-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search your posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#1a1d29] border-[#374151] text-white placeholder-gray-400 focus:border-[#0077B5]"
                />
              </div>
              <Button variant="outline" className="border-[#374151] text-[#0077B5] hover:bg-[#374151] bg-transparent">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="mb-4">
              <span className="text-gray-400">{filteredPosts.length} posts in your library</span>
            </div>

            {filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    className="bg-[#2d3748] rounded-xl p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{post.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyPost(post.content)}
                          className="text-gray-400 hover:text-white hover:bg-[#374151]"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePost(post.id)}
                          className="text-gray-400 hover:text-red-400 hover:bg-[#374151]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-gray-300 leading-relaxed">
                        {expandedPost === post.id ? post.content : post.preview}
                      </p>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => toggleExpand(post.id)}
                      className="flex items-center gap-2 text-[#0077B5] text-sm hover:underline"
                    >
                      {expandedPost === post.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Click to collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Click to expand
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery ? "No posts match your search." : "Start creating your first post!"}
                </p>
                {!searchQuery && (
                  <Button className="bg-[#0077B5] hover:bg-[#004182] text-white">Create your first post</Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
