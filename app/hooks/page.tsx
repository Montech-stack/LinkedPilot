"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Copy, Trash2, Save, X, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"
import { useRouter } from "next/navigation"
import { usePostGeneration } from "@/hooks/usePostGeneration"
import toast from "react-hot-toast"

interface ViralIdea {
  id: number
  category: string
  hook: string
  engagement: string
  score: number
  keywords: string[]
}

export default function ViralIdeasLibrary() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [generatedIdeas, setGeneratedIdeas] = useState<ViralIdea[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { generatePosts } = usePostGeneration()

  // Load cached ideas from localStorage if needed
  useEffect(() => {
    const cachedIdeas = localStorage.getItem("generatedIdeas")
    if (cachedIdeas) {
      try {
        const parsed = JSON.parse(cachedIdeas)
        if (Array.isArray(parsed)) setGeneratedIdeas(parsed)
      } catch {
        localStorage.removeItem("generatedIdeas")
      }
    }
  }, [])

  const processedIdeas = useMemo(() => {
    if (!generatedIdeas.length) return []
    if (!userInput.trim()) return [...generatedIdeas].sort((a, b) => b.score - a.score)

    const keywords = userInput.toLowerCase().split(" ").filter((w) => w.length > 2)
    return generatedIdeas
      .map((idea) => {
        let relevance = 0
        keywords.forEach((k) => {
          const keywordMatches = idea.keywords.filter(
            (kw) => kw.toLowerCase().includes(k) || k.includes(kw.toLowerCase())
          ).length
          const textMatches = idea.hook.toLowerCase().includes(k) ? 1 : 0
          const categoryMatches = idea.category.toLowerCase().includes(k) ? 1 : 0
          relevance += keywordMatches * 3 + textMatches * 2 + categoryMatches
        })
        return { ...idea, combinedScore: relevance * 0.7 + idea.score * 0.3 }
      })
      .sort((a, b) => b.combinedScore - a.combinedScore)
  }, [userInput, generatedIdeas])

  const handleGenerate = async (isMore = false) => {
    if (!userInput.trim()) return toast.error("Please enter a topic or niche")
    setIsGenerating(true)
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput, previous: isMore ? generatedIdeas.map((i) => i.hook) : [] }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      const validIdeas = data.ideas
        .filter((i: any) => i.category && i.hook && i.engagement && typeof i.score === "number" && Array.isArray(i.keywords))
        .map((i: Omit<ViralIdea, "id">, idx: number) => ({
          id: generatedIdeas.length + idx + 1,
          category: ["Controversial", "Question", "Story", "List", "Career Advice"].includes(i.category)
            ? i.category
            : "General",
          hook: i.hook,
          engagement: ["Very High", "High", "Medium"].includes(i.engagement) ? i.engagement : "Medium",
          score: Math.min(95, Math.max(70, i.score)),
          keywords: i.keywords.slice(0, 7),
        }))
      if (!validIdeas.length) throw new Error("No valid ideas")
      const newIdeas = [...generatedIdeas, ...validIdeas]
      setGeneratedIdeas(newIdeas)
      localStorage.setItem("generatedIdeas", JSON.stringify(newIdeas))
      toast.success(`Generated ${validIdeas.length} idea${validIdeas.length > 1 ? "s" : ""}`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to generate ideas")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClear = () => {
    setGeneratedIdeas([])
    localStorage.removeItem("generatedIdeas")
    setUserInput("")
  }

  const handleSave = async () => {
    if (!generatedIdeas.length) return toast.error("No ideas to save")
    try {
      const res = await fetch("/api/save-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideas: generatedIdeas }),
      })
      if (!res.ok) throw new Error("Failed to save ideas")
      toast.success(`Saved ${generatedIdeas.length} idea${generatedIdeas.length > 1 ? "s" : ""}`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to save ideas")
    }
  }

  const deleteIdea = (id: number) => {
    setGeneratedIdeas((prev) => prev.filter((i) => i.id !== id))
    localStorage.setItem(
      "generatedIdeas",
      JSON.stringify(generatedIdeas.filter((i) => i.id !== id))
    )
  }

  // NEW: Navigate to dashboard with query param
  const handleIdeaClick = (hook: string) => {
    router.push(`/dashboard?input=${encodeURIComponent(hook)}`)
    toast.success("Idea sent to Dashboard!")
  }

  const copyIdea = (hook: string) => {
    navigator.clipboard.writeText(hook)
    toast.success("Copied!")
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case "Very High":
        return "text-green-400 bg-green-400/10 border-green-400/20"
      case "High":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20"
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400"
    if (score >= 80) return "text-blue-400"
    if (score >= 70) return "text-yellow-400"
    return "text-gray-400"
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col md:flex-row">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-[#00FFFF] via-[#00BFFF] to-[#FFA500] bg-clip-text text-transparent">
              Viral Ideas Library
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Generate multi-platform content ideas</p>
          </motion.div>

          <motion.div className="bg-[#1b1f2a] p-4 rounded-2xl shadow-2xl border border-[#2c2f3a] mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Textarea
              placeholder="Enter your topic or niche..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="min-h-[100px] bg-[#11151c] text-white border border-[#2c2f3a] rounded-xl p-3 text-sm sm:text-base resize-none focus:ring-2 focus:ring-[#0077B5]/40"
            />

            <div className="flex gap-2 mt-3 justify-start">
              <Button size="icon" onClick={handleSave} className="bg-[#0077B5] hover:bg-[#005f8f] rounded-xl p-2">
                <Save size={20} />
              </Button>
              <Button size="icon" onClick={handleClear} className="bg-[#7f1d1d] hover:bg-[#5c1313] rounded-xl p-2">
                <X size={20} />
              </Button>
              <Button
                onClick={() => handleGenerate(false)}
                disabled={isGenerating || !userInput.trim()}
                className="flex-1 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white font-semibold py-2 px-4 rounded-xl text-sm"
              >
                {isGenerating ? "Generating..." : "Generate Top 5 Ideas"}
              </Button>
            </div>
          </motion.div>

          {processedIdeas.length > 0 && (
            <motion.div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {processedIdeas.map((idea) => (
                <motion.div key={idea.id} className="bg-[#161b23] rounded-2xl p-3 border border-[#2c2f3a] shadow-lg hover:shadow-xl transition-all duration-200 relative">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-[#0077B5]/20 text-[#00BFFF] rounded-full text-xs font-medium truncate">
                      {idea.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEngagementColor(idea.engagement)}`}>
                      {idea.engagement} Engagement
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(idea.score)}`}>
                      {idea.score}/100
                    </span>
                  </div>

                  <p
                    onClick={() => handleIdeaClick(idea.hook)}
                    className="text-sm sm:text-base font-medium text-gray-100 mb-2 cursor-pointer hover:text-[#00BFFF]"
                  >
                    {idea.hook}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {idea.keywords.map((k, idx) => (
                      <span key={idx} className="text-xs text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded">
                        {k}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button size="icon" variant="ghost" onClick={() => copyIdea(idea.hook)} className="text-gray-400 hover:text-white">
                      <Copy size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteIdea(idea.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
