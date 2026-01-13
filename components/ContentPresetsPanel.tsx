"use client"

import React, { useState, useRef, useMemo } from "react"
import {
  Check,
  Info,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Search,
  X,
  FileText,
  MessageSquare,
  Mail,
  Video,
  Briefcase,
  BookOpen,
} from "lucide-react"

// Default content creation presets
const DEFAULT_PRESETS = [
  {
    id: "blog-post",
    name: "Blog Post",
    subtitle: "Long-form content",
    thumbnail: "📝",
    promptSnippet: "Write a comprehensive blog post with introduction, main points, and conclusion. Use engaging language and SEO-friendly structure.",
    description: "Creates well-structured blog posts with clear sections, engaging introductions, and actionable conclusions.",
    category: "Writing",
  },
  {
    id: "social-media",
    name: "Social Media",
    subtitle: "Short & engaging",
    thumbnail: "📱",
    promptSnippet: "Create concise, engaging social media content with hooks, emojis, and call-to-actions. Keep it under 280 characters for Twitter or 2200 for LinkedIn.",
    description: "Crafts attention-grabbing social media posts optimized for different platforms.",
    category: "Marketing",
  },
  {
    id: "email",
    name: "Email Copy",
    subtitle: "Professional emails",
    thumbnail: "✉️",
    promptSnippet: "Write professional email copy with clear subject line, personalized greeting, concise body, and strong call-to-action.",
    description: "Generates effective email content for marketing, outreach, or communication.",
    category: "Marketing",
  },
  {
    id: "video-script",
    name: "Video Script",
    subtitle: "Engaging scripts",
    thumbnail: "🎬",
    promptSnippet: "Create a video script with hook, main content sections, transitions, and outro. Include timestamps and visual cues.",
    description: "Produces structured video scripts with timing, dialogue, and production notes.",
    category: "Content",
  },
  {
    id: "product-description",
    name: "Product Copy",
    subtitle: "Sales-focused",
    thumbnail: "🛍️",
    promptSnippet: "Write compelling product descriptions highlighting features, benefits, and unique selling points. Include persuasive language.",
    description: "Creates conversion-optimized product descriptions that sell.",
    category: "E-commerce",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    subtitle: "Subscriber content",
    thumbnail: "📰",
    promptSnippet: "Design a newsletter with attention-grabbing headline, sections with updates/tips, and clear next steps or links.",
    description: "Formats engaging newsletters with multiple sections and reader-friendly layout.",
    category: "Marketing",
  },
  {
    id: "case-study",
    name: "Case Study",
    subtitle: "Success stories",
    thumbnail: "📊",
    promptSnippet: "Structure a case study with problem statement, solution approach, implementation, results with metrics, and key takeaways.",
    description: "Develops detailed case studies showcasing results and impact.",
    category: "Business",
  },
  {
    id: "how-to-guide",
    name: "How-To Guide",
    subtitle: "Step-by-step",
    thumbnail: "📋",
    promptSnippet: "Create a step-by-step tutorial with clear instructions, prerequisites, detailed steps, tips, and troubleshooting section.",
    description: "Produces comprehensive guides with actionable steps and helpful tips.",
    category: "Educational",
  },
]

export default function ContentPresetsPanel() {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [advancedMode, setAdvancedMode] = useState(false)
  const [customPresets, setCustomPresets] = useState<typeof DEFAULT_PRESETS>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [presetOrder, setPresetOrder] = useState<string[]>(DEFAULT_PRESETS.map(p => p.id))
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetSubtitle, setNewPresetSubtitle] = useState("")
  const [newPresetSnippet, setNewPresetSnippet] = useState("")
  const [newPresetDescription, setNewPresetDescription] = useState("")
  const [newPresetThumbnail, setNewPresetThumbnail] = useState("📄")
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const allPresets = [...customPresets, ...DEFAULT_PRESETS]

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return allPresets
    const query = searchQuery.toLowerCase()
    return allPresets.filter(
      (preset) =>
        preset.name.toLowerCase().includes(query) ||
        preset.subtitle.toLowerCase().includes(query) ||
        preset.description.toLowerCase().includes(query) ||
        preset.category?.toLowerCase().includes(query) ||
        preset.promptSnippet.toLowerCase().includes(query),
    )
  }, [searchQuery, allPresets])

  const sortedPresets = filteredPresets.sort((a, b) => {
    const aIndex = presetOrder.indexOf(a.id)
    const bIndex = presetOrder.indexOf(b.id)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const togglePreset = (id: string) => {
    if (advancedMode) {
      setSelectedPresets(prev =>
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      )
    } else {
      setSelectedPresets(prev => prev.includes(id) ? [] : [id])
    }
  }

  const handleCreatePreset = () => {
    if (!newPresetName.trim() || !newPresetSnippet.trim()) {
      alert("Please fill in name and prompt snippet")
      return
    }

    const newPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      subtitle: newPresetSubtitle || "Custom preset",
      thumbnail: newPresetThumbnail || "📄",
      promptSnippet: newPresetSnippet,
      description: newPresetDescription || "Custom user-created preset",
      category: "Custom",
    }

    setCustomPresets(prev => [...prev, newPreset])
    setPresetOrder(prev => [newPreset.id, ...prev])

    setNewPresetName("")
    setNewPresetSubtitle("")
    setNewPresetSnippet("")
    setNewPresetDescription("")
    setNewPresetThumbnail("📄")
    setIsDialogOpen(false)
  }

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id)
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData("text/plain")
    if (draggedId) {
      const newOrder = presetOrder.filter((id) => id !== draggedId)
      const targetIndex = newOrder.indexOf(targetId)
      newOrder.splice(targetIndex + 1, 0, draggedId)
      setPresetOrder(newOrder)
    }
    setDraggedItem(null)
  }

  const PresetCard = ({ preset }: { preset: typeof DEFAULT_PRESETS[0] }) => {
    const isSelected = selectedPresets.includes(preset.id)
    const order = selectedPresets.indexOf(preset.id) + 1
    const isCustom = preset.id.startsWith("custom-")
    const [showTooltip, setShowTooltip] = useState(false)

    return (
      <div className="relative">
        <button
          draggable
          onDragStart={(e) => handleDragStart(e, preset.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, preset.id)}
          onClick={() => togglePreset(preset.id)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`group relative w-full rounded-lg border-2 transition-all ${
            draggedItem === preset.id ? "opacity-50" : ""
          } ${
            isSelected
              ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
              : "border-[#2A2A35] hover:border-blue-500/50 hover:bg-[#1f2633]"
          }`}
        >
          <div className="aspect-square rounded-t-md overflow-hidden bg-gradient-to-br from-[#1A1B22] to-[#14151B] relative flex items-center justify-center border-b border-[#2A2A35]">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
              <GripHorizontal className="w-5 h-5 text-white" />
            </div>
            <span className="text-5xl">{preset.thumbnail}</span>
          </div>

          <div className="p-3 bg-[#14151B] rounded-b-md">
            <p className="text-sm font-semibold text-white leading-tight">{preset.name}</p>
            <p className="text-xs text-gray-500 leading-tight mt-1">{preset.subtitle}</p>
            {preset.category && (
              <span className="inline-block text-[10px] mt-2 px-2 py-0.5 bg-[#1A1B22] border border-[#2A2A35] text-gray-400 rounded-full">
                {preset.category}
              </span>
            )}
          </div>

          {isSelected && (
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              {advancedMode && order > 0 ? (
                <span className="text-sm font-bold text-white">{order}</span>
              ) : (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
          )}

          {isCustom && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCustomPresets(prev => prev.filter(p => p.id !== preset.id))
              }}
              className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Info className="w-3 h-3 text-white" />
            </div>
          </div>
        </button>

        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-[#1A1B22] text-white rounded-lg shadow-xl border border-[#2A2A35]">
            <div className="space-y-2">
              <p className="text-sm font-semibold">{preset.name}</p>
              <p className="text-xs text-gray-300 leading-relaxed">{preset.description}</p>
              <div className="pt-2 border-t border-[#2A2A35]">
                <p className="text-[10px] text-gray-500 mb-1">Adds to prompt:</p>
                <code className="text-[10px] bg-[#0F1116] px-2 py-1 rounded block text-gray-300">
                  {preset.promptSnippet}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0F1116]">
        <div className="h-full flex flex-col">
          <div className="border-b border-[#2A2A35] p-4 bg-[#14151B]">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  All Content Presets
                </h2>
                <span className="px-2 py-1 bg-[#1A1B22] border border-[#2A2A35] text-xs rounded-full text-gray-400">
                  {sortedPresets.length} available
                </span>
                <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-full">
                  {selectedPresets.length} selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 border border-[#2A2A35] rounded-lg bg-[#0F1116] text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsFullscreen(false)}
                  className="px-4 py-2 border border-[#2A2A35] rounded-lg text-sm flex items-center gap-2 hover:bg-[#1f2633] bg-[#14151B] transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                  Collapse
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <button
                  onClick={() => setIsDialogOpen(true)}
                  className="rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square min-h-[140px]"
                >
                  <Plus className="w-8 h-8 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Create Custom</span>
                </button>

                {sortedPresets.map((preset) => (
                  <PresetCard key={preset.id} preset={preset} />
                ))}
              </div>

              {sortedPresets.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No presets found for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 bg-[#14151B] rounded-xl border border-[#2A2A35] shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Content Presets
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-[#1f2633] rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1 hover:bg-[#1f2633] rounded transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-[#1A1B22] border border-[#2A2A35] text-xs rounded-full text-gray-400">
            {selectedPresets.length} selected
          </span>
          <button
            onClick={() => setAdvancedMode(!advancedMode)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {advancedMode ? "Multi-select" : "Single-select"}
          </button>
        </div>
      </div>

      {!isExpanded ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex-shrink-0 w-24 sm:w-28 rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square"
          >
            <Plus className="w-6 h-6 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Custom</span>
          </button>

          {sortedPresets.slice(0, 10).map((preset) => (
            <div key={preset.id} className="flex-shrink-0 w-24 sm:w-28">
              <PresetCard preset={preset} />
            </div>
          ))}

          <button
            onClick={() => setIsFullscreen(true)}
            className="flex-shrink-0 w-24 sm:w-28 rounded-lg border-2 border-dashed border-[#2A2A35] hover:border-gray-500 hover:bg-[#1f2633] transition-all flex flex-col items-center justify-center gap-2 aspect-square"
          >
            <Maximize2 className="w-5 h-5 text-gray-500" />
            <span className="text-xs text-gray-500">View All</span>
            <span className="text-[10px] text-gray-600">({allPresets.length}+)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square"
          >
            <Plus className="w-6 h-6 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Create Custom</span>
          </button>

          {sortedPresets.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1A1B22] border border-[#2A2A35] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-white">Create Custom Preset</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Preset Name</label>
                <input
                  placeholder="e.g., LinkedIn Post"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#2A2A35] rounded-lg bg-[#0F1116] text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Subtitle (optional)</label>
                <input
                  placeholder="e.g., Professional networking"
                  value={newPresetSubtitle}
                  onChange={(e) => setNewPresetSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#2A2A35] rounded-lg bg-[#0F1116] text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Emoji Icon</label>
                <input
                  placeholder="e.g., 💼"
                  value={newPresetThumbnail}
                  onChange={(e) => setNewPresetThumbnail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#2A2A35] rounded-lg bg-[#0F1116] text-white focus:border-blue-500 focus:outline-none transition-colors"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Prompt Snippet</label>
                <textarea
                  placeholder="e.g., Write a professional LinkedIn post with engaging hook..."
                  value={newPresetSnippet}
                  onChange={(e) => setNewPresetSnippet(e.target.value)}
                  className="w-full px-3 py-2 border border-[#2A2A35] rounded-lg bg-[#0F1116] text-white min-h-[100px] focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Description (optional)</label>
                <textarea
                  placeholder="Describe what this preset does..."
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#2A2A35] rounded-lg bg-[#0F1116] text-white min-h-[60px] focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreatePreset}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-yellow-500 text-white rounded-lg hover:from-blue-600 hover:to-yellow-600 font-medium transition-all"
                >
                  Create Preset
                </button>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 border border-[#2A2A35] rounded-lg hover:bg-[#1f2633] transition-colors text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}