"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Copy, Trash2, Save, X, Lightbulb, Sparkles, Wand2, TrendingUp, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"
import { useRouter } from "next/navigation"
import { usePostGeneration } from "@/hooks/usePostGeneration"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

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
  const [tone, setTone] = useState("contrarian");
  const [audience, setAudience] = useState("");
  const router = useRouter()
  const { data: session } = useSession();

  const [userPlan, setUserPlan] = useState<UserPlan>("free");
  const [tokensRemaining, setTokensRemaining] = useState(0);
  const userEmail = session?.user?.email;

  // Fetch Stats
  useEffect(() => {
    async function fetchUserStats() {
      if (!userEmail) return;
      try {
        const res = await fetch(`/api/user/stats?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan || "free");
          setTokensRemaining(data.tokensRemaining || 0);
        }
      } catch { }
    }
    fetchUserStats();
  }, [userEmail]);

  // Load Cache
  useEffect(() => {
    const cachedIdeas = localStorage.getItem("generatedIdeas")
    if (cachedIdeas) {
      try {
        const parsed = JSON.parse(cachedIdeas)
        if (Array.isArray(parsed)) setGeneratedIdeas(parsed)
      } catch { }
    }
  }, [])

  const handleGenerate = async () => {
    if (!userInput.trim()) return toast.error("Please enter a topic or niche")

    const numIdeas = 5;
    const tokenCostPerIdea = 100;
    const totalCost = numIdeas * tokenCostPerIdea;

    if (userPlan !== "enterprise" && tokensRemaining < totalCost) {
      toast.error("Insufficient tokens!");
      return;
    }

    setIsGenerating(true)
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput, previous: generatedIdeas.map((i) => i.hook), tone, audience }),
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()

      const newIdeas = data.ideas.map((i: any, idx: number) => ({
        id: Date.now() + idx,
        category: i.category || "General",
        hook: i.hook,
        engagement: i.engagement || "Medium",
        score: i.score || 85,
        keywords: i.keywords || []
      }))

      const updated = [...newIdeas, ...generatedIdeas];
      setGeneratedIdeas(updated);
      localStorage.setItem("generatedIdeas", JSON.stringify(updated));
      toast.success("Ideas Generated!");

      if (userPlan !== "enterprise") {
        await fetch("/api/deduct-token", { // Note: using deduct-token endpoint
          method: "POST", body: JSON.stringify({ usedTokens: totalCost, email: userEmail })
        });
        setTokensRemaining(p => p - totalCost);
      }
    } catch (err) {
      toast.error("Failed to generate ideas")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = (id: number) => {
    const next = generatedIdeas.filter(i => i.id !== id);
    setGeneratedIdeas(next);
    localStorage.setItem("generatedIdeas", JSON.stringify(next));
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          <div className="max-w-6xl mx-auto px-6 py-10 w-full">

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Lightbulb className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />
                  Viral Labs
                </h1>
                <p className="text-muted-foreground mt-1">Generate high-converting angles for your next post.</p>
              </div>
              <div className="bg-muted px-4 py-1.5 rounded-full border border-border text-xs font-mono text-muted-foreground">
                Tokens: <span className={tokensRemaining < 500 ? 'text-destructive' : 'text-primary'}>{userPlan === 'enterprise' ? '∞' : tokensRemaining}</span>
              </div>
            </div>

            {generatedIdeas.length > 0 && (
              <div className="flex justify-end mb-4">
                <Button variant="ghost" size="sm" onClick={() => {
                  setGeneratedIdeas([]);
                  localStorage.removeItem("generatedIdeas");
                  toast.success("All ideas cleared");
                }} className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear History
                </Button>
              </div>
            )}

            {/* Generator Input */}
            <div className="relative group rounded-3xl p-1 bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-pink-600/50 transition-all duration-300 mb-12">
              <div className="bg-card rounded-[22px] p-6 relative z-10 border border-border">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder="What keeps your audience up at night? (e.g. 'Productivity for ADHD devs')"
                        className="w-full h-14 bg-background border border-input rounded-xl px-5 text-lg placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                      />
                      <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <select
                      className="h-10 bg-background border border-input rounded-lg px-3 text-sm text-muted-foreground focus:outline-none focus:border-primary"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      <option value="contrarian">Contrarian & Bold</option>
                      <option value="storyteller">Storyteller</option>
                      <option value="analytical">Analytical & Data-Driven</option>
                      <option value="empathetic">Empathetic & Supportive</option>
                      <option value="humorous">Humorous & Witty</option>
                    </select>

                    <input
                      className="h-10 flex-1 bg-background border border-input rounded-lg px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      placeholder="Target Audience (e.g. Founders, Jr Devs...)"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />

                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !userInput.trim()}
                      className="h-10 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-xl shadow-primary/5 transition-all ml-auto"
                    >
                      {isGenerating ? <div className="flex gap-2"><Sparkles className="animate-spin w-4 h-4" /> Thinking...</div> : "Generate"}
                    </Button>
                  </div>
                </div>
              </div>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 -z-10" />
            </div>

            {/* Ideas Grid */}
            <AnimatePresence>
              {generatedIdeas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedIdeas.map((idea, i) => (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl p-5 border border-border hover:border-primary/30 group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 flex flex-col justify-between h-full"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 text-xs font-semibold uppercase tracking-wider">
                            {idea.category}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                            <TrendingUp className="w-3 h-3" />
                            {idea.score}/100
                          </div>
                        </div>
                        <p
                          className="text-lg font-medium text-card-foreground leading-relaxed mb-6 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            router.push(`/dashboard?input=${encodeURIComponent(idea.hook)}`);
                            toast.success("Loaded into editor!");
                          }}
                        >
                          {idea.hook}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(idea.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0"
                            onClick={() => {
                              navigator.clipboard.writeText(idea.hook);
                              toast.success("Copied!");
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                            onClick={() => router.push(`/dashboard?input=${encodeURIComponent(idea.hook)}`)}
                          >
                            Use This <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 opacity-50">
                  <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-muted-foreground">Your lab is empty</h3>
                  <p className="text-muted-foreground">Enter a topic above to start generating viral angles.</p>
                </div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  )
}