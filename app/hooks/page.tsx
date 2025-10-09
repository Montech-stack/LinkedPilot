"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Copy, Lightbulb, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"
import { useRouter } from "next/navigation"
import { useLinkedInAuth } from "@/hooks/useLinkedInAuth"
import { useLinkedInPosting } from "@/hooks/useLinkedInPosting"
import { usePostGeneration } from "@/hooks/usePostGeneration"
import toast from "react-hot-toast"
import AutomationPreferencesModal from "@/components/AutomationPreferencesModal"

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
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated, authenticate } = useLinkedInAuth()
  const { postToLinkedIn } = useLinkedInPosting()
  const { generatePosts } = usePostGeneration()

  const processedIdeas = useMemo(() => {
    if (!generatedIdeas.length) {
      return generatedIdeas
    }

    if (!userInput.trim()) {
      return [...generatedIdeas].sort((a, b) => b.score - a.score)
    }

    const keywords = userInput.toLowerCase().split(" ").filter((word) => word.length > 2)

    const ideasWithRelevance = generatedIdeas.map((idea) => {
      let relevanceScore = 0

      keywords.forEach((keyword) => {
        const keywordMatches = idea.keywords.filter(
          (ideaKeyword) => ideaKeyword.includes(keyword) || keyword.includes(ideaKeyword),
        ).length

        const textMatches = idea.hook.toLowerCase().includes(keyword) ? 1 : 0

        const categoryMatch = idea.category.toLowerCase().includes(keyword) ? 1 : 0

        relevanceScore += keywordMatches * 3 + textMatches * 2 + categoryMatch
      })

      const combinedScore = relevanceScore * 0.7 + idea.score * 0.3

      return {
        ...idea,
        relevanceScore,
        combinedScore,
      }
    })

    return ideasWithRelevance.sort((a, b) => b.combinedScore - a.combinedScore)
  }, [userInput, generatedIdeas])

  const handleGenerate = async (isMore = false) => {
    if (!userInput.trim()) {
      toast.error("Please enter a topic or niche")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userInput,
          previous: isMore ? generatedIdeas.map(i => i.hook) : [],
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate ideas: ${response.status}`)
      }

      const data = await response.json()
      console.log('API Response:', data.ideas)

      const newIdeas = data.ideas.map((idea: Omit<ViralIdea, 'id'>, index: number) => ({
        ...idea,
        id: generatedIdeas.length + index + 1,
      }))

      setGeneratedIdeas(prev => isMore ? [...prev, ...newIdeas] : newIdeas)
      toast.success(`Generated ${newIdeas.length} new ideas!`)
    } catch (error) {
      console.error('Error generating ideas:', error)
      toast.error("Failed to generate ideas")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMore = () => {
    handleGenerate(true)
  }

  const handleSave = () => {
    const savedIdeas = generatedIdeas.filter(idea => selected.has(idea.id))
    if (savedIdeas.length === 0) {
      toast.error("No ideas selected to save")
      return
    }
    localStorage.setItem('savedIdeas', JSON.stringify(savedIdeas))
    toast.success(`Saved ${savedIdeas.length} idea${savedIdeas.length > 1 ? 's' : ''} to local storage`)
    setSelected(new Set())
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleIdeaClick = (hook: string) => {
    const sanitizedHook = hook.replace(/[^\w\s-.,!?]/g, '')
    router.push(`/dashboard?input=${encodeURIComponent(sanitizedHook)}`)
  }

  const handleAutomate = async () => {
    if (!isAuthenticated) {
      authenticate()
      return
    }
    if (!userInput.trim()) {
      toast.error("Please enter a topic or niche to automate")
      return
    }
    setIsAutomationModalOpen(true)
  }

  const handleAutomationPreferencesConfirm = async (preferences: { frequency: 'daily' | 'weekly' | 'monthly'; tone: string; length: string; count: number }) => {
    setIsGenerating(true)

    try {
      // Generate ideas if none exist
      if (generatedIdeas.length === 0) {
        await handleGenerate()
      }

      const ideasToProcess = selected.size > 0 
        ? generatedIdeas.filter(idea => selected.has(idea.id))
        : generatedIdeas.slice(0, preferences.count)

      if (ideasToProcess.length === 0) {
        toast.error("No ideas available to process")
        return
      }

      // Schedule initial posts
      for (const idea of ideasToProcess) {
        const posts = await generatePosts(idea.hook, preferences.tone, 1, preferences.length)
        if (posts.length > 0) {
          const result = await postToLinkedIn({ content: posts[0].content })
          if (result.success) {
            console.log(`Posted idea: ${idea.hook}`)
            toast.success(`Posted idea: ${idea.hook}`)
          } else {
            console.error(`Failed to post idea: ${idea.hook}`)
            toast.error(`Failed to post idea: ${idea.hook}`)
          }
        }
      }

      // Save automation preferences to backend
      const response = await fetch('/api/schedule-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: userInput,
          tone: preferences.tone,
          length: preferences.length,
          count: preferences.count,
          frequency: preferences.frequency,
          nextRun: new Date(), // Immediate scheduling for testing
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to schedule automation: ${response.status}`)
      }

      toast.success(`Automation scheduled for ${preferences.frequency} posts!`)
      setIsAutomationModalOpen(false)
    } catch (error) {
      console.error('Error automating post:', error)
      toast.error("Failed to set up automation")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyIdea = (hook: string) => {
    navigator.clipboard.writeText(hook)
    toast.success("Idea copied to clipboard!")
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
    <div className="min-h-screen gradient-bg text-white flex overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} showBackButton={false} />
        <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto">
          <motion.div
            className="mb-6 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 gradient-text">Viral Ideas Library</h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0">
              Generate viral content ideas based on LinkedIn trends for your topic or niche
            </p>
          </motion.div>

          <motion.div
            className="gradient-card rounded-xl p-3 sm:p-4 lg:p-6 border border-[#2d3748] shadow-xl glow-card backdrop-blur-sm mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full flex items-center justify-center shadow-lg">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">Generate Viral Ideas</h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Enter a topic or niche (e.g., "AI in marketing", "startup growth hacks")</p>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="topic-input" className="text-xs sm:text-sm font-medium text-gray-300 mb-2 block">
                Topic or Niche
              </label>
              <motion.div
                initial={{ scale: 1 }}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Textarea
                  id="topic-input"
                  placeholder="Enter your topic or niche for viral content ideas..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5] focus:ring-offset-2 hover:border-[#0077B5] rounded-lg text-sm sm:text-base leading-relaxed shadow-lg transition-all duration-300 resize-y w-full overflow-auto"
                />
              </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              <Button
                onClick={() => handleGenerate(false)}
                disabled={isGenerating || !userInput.trim()}
                className="w-full sm:w-auto flex-1 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Top 5 Ideas"
                )}
              </Button>
              <Button
                onClick={handleAutomate}
                className="w-full sm:w-auto flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
              >
                Automate Posting
              </Button>
            </div>

            {generatedIdeas.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                <Button
                  onClick={handleSave}
                  disabled={selected.size === 0}
                  variant="outline"
                  className="w-full sm:w-auto flex-1 border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5]/10 hover:text-[#0077B5] font-semibold rounded-lg shadow-md transition-all duration-300 py-2 px-4 text-sm sm:text-base"
                >
                  Save Selected ({selected.size})
                </Button>
                <Button
                  onClick={handleMore}
                  disabled={isGenerating}
                  className="w-full sm:w-auto flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 py-2 px-4 text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "More Ideas"
                  )}
                </Button>
              </div>
            )}
          </motion.div>

          <AutomationPreferencesModal
            isOpen={isAutomationModalOpen}
            onClose={() => setIsAutomationModalOpen(false)}
            onConfirm={handleAutomationPreferencesConfirm}
          />

          <motion.div
            className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {processedIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                className="gradient-card rounded-xl p-3 sm:p-4 border border-[#2d3748] hover:border-[#0077B5] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer glow-card w-full max-w-full overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, y: -2 }}
                onClick={() => handleIdeaClick(idea.hook)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white rounded-full text-xs font-medium shadow-md truncate max-w-[60px] sm:max-w-[80px]">
                      #{index + 1}
                    </span>
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-[#0077B5]/20 text-[#0077B5] rounded-full text-xs font-medium border border-[#0077B5]/20 truncate max-w-[80px] sm:max-w-[100px]">
                      {idea.category}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-xs font-medium border ${getEngagementColor(idea.engagement)} truncate max-w-[100px] sm:max-w-[120px]`}
                    >
                      {idea.engagement} Engagement
                    </span>
                    <span
                      className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-xs font-medium border ${getScoreColor(idea.score)} truncate max-w-[60px] sm:max-w-[80px]`}
                    >
                      {idea.score}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Checkbox
                      checked={selected.has(idea.id)}
                      onCheckedChange={() => toggleSelect(idea.id)}
                      className="border-[#0077B5] data-[state=checked]:bg-[#0077B5] data-[state=checked]:border-[#0077B5] w-5 h-5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyIdea(idea.hook)
                      }}
                      className="text-gray-400 hover:text-white hover:bg-[#2d3748] rounded-full transition-all duration-300 w-8 h-8"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-100 leading-relaxed font-medium truncate">{idea.hook}</p>
              </motion.div>
            ))}
          </motion.div>

          {generatedIdeas.length === 0 && (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-200">No Ideas Generated Yet</h3>
              <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
                Enter a topic or niche above and click "Generate Top 5 Ideas" to get started.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}