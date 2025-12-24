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
import { useSession } from "next-auth/react"

type UserPlan = "free" | "pro" | "enterprise";

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
  const { data: session } = useSession();

  const [userPlan, setUserPlan] = useState<UserPlan>("free");
  const [tokensRemaining, setTokensRemaining] = useState(0);
  const userEmail = session?.user?.email || "guest@example.com";

  // Fetch user plan and tokens
  useEffect(() => {
    async function fetchUserStats() {
      try {
        const res = await fetch(`/api/user/stats?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error("Failed to fetch user stats");
        const data = await res.json();
        setUserPlan(data.plan || "free");
        setTokensRemaining(data.tokensRemaining || 0);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load user plan");
      }
    }
    if (userEmail) fetchUserStats();
  }, [userEmail]);

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

    const numIdeas = 5;
    const tokenCostPerIdea = 100;
    const totalTokensNeeded = numIdeas * tokenCostPerIdea;

    if (userPlan !== "enterprise" && tokensRemaining < totalTokensNeeded) {
      toast.error("Insufficient tokens! Redirecting to billing...");
      router.push("/billing");
      return;
    }

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

      // Deduct tokens
      if (userPlan !== "enterprise") {
        await fetch("/api/deduct-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usedTokens: totalTokensNeeded, email: userEmail }),
        });
        setTokensRemaining((prev) => prev - totalTokensNeeded);
      }
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
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      case "High":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20"
      case "Medium":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-yellow-400"
    if (score >= 80) return "text-blue-500"
    if (score >= 70) return "text-gray-400"
    return "text-gray-400"
  }

  return (
    <div className="min-h-screen bg-[#0F1116] text-white flex flex-col md:flex-row">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-10">
            <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-blue-500 to-yellow-400 bg-clip-text text-transparent">
                Viral Ideas Library
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">Generate multi-platform content ideas</p>
            </motion.div>

            <motion.div className="bg-[#1A1B22] p-4 rounded-2xl shadow-2xl border border-[#2A2A35] mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Textarea
                placeholder="Enter your topic or niche..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[100px] bg-[#14151B] text-white border border-[#2A2A35] rounded-xl p-3 text-sm sm:text-base resize-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
              />

              <div className="flex gap-2 mt-3 justify-start">
                <Button size="icon" onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 rounded-xl p-2">
                  <Save size={20} />
                </Button>
                <Button size="icon" onClick={handleClear} className="bg-gray-700 hover:bg-gray-600 rounded-xl p-2">
                  <X size={20} />
                </Button>
                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || !userInput.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white font-semibold py-2 px-4 rounded-xl text-sm"
                >
                  {isGenerating ? "Generating..." : "Generate Top 5 Ideas"}
                </Button>
              </div>
            </motion.div>

            {processedIdeas.length > 0 && (
              <motion.div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {processedIdeas.map((idea) => (
                  <motion.div key={idea.id} className="bg-[#14151B] rounded-2xl p-3 border border-[#2A2A35] shadow-lg hover:shadow-xl transition-all duration-200 relative">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded-full text-xs font-medium truncate">
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
                      className="text-sm sm:text-base font-medium text-gray-100 mb-2 cursor-pointer hover:text-blue-500"
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
                      <Button size="icon" variant="ghost" onClick={() => deleteIdea(idea.id)} className="text-gray-400 hover:text-gray-300">
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
    </div>
  )
}