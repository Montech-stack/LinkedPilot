"use client"

import type React from "react"
import { useState, useRef, useMemo } from "react"
import { Plus, ChevronDown, ChevronUp, Trash2, Maximize2, Minimize2, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useContentPresetStore, PRESETS } from "@/lib/content-preset-store"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ContentPresetCard } from "./content-preset-card"
import toast from "react-hot-toast"
import type { ContentPreset } from "@/lib/types/content-preset"

export function ContentPresetsPanel() {
  const {
    selectedPresets,
    togglePreset,
    advancedMode,
    setAdvancedMode,
    customPresets,
    addCustomPreset,
    removeCustomPreset,
    isPresetsExpanded,
    setPresetsExpanded,
    isPresetsFullscreen,
    setPresetsFullscreen,
    presetOrder,
    reorderPresets,
  } = useContentPresetStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")
  const [newPresetSubtitle, setNewPresetSubtitle] = useState("")
  const [newPresetSnippet, setNewPresetSnippet] = useState("")
  const [newPresetDescription, setNewPresetDescription] = useState("")
  const [newPresetThumbnail, setNewPresetThumbnail] = useState<string>("")
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allPresets = [...customPresets, ...PRESETS]

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
  }, [searchQuery])

  const sortedPresets = filteredPresets.sort((a, b) => {
    const aIndex = presetOrder.indexOf(a.id)
    const bIndex = presetOrder.indexOf(b.id)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setNewPresetThumbnail(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreatePreset = () => {
    if (!newPresetName.trim() || !newPresetSnippet.trim()) {
      toast.error("Please fill in name and prompt snippet")
      return
    }

    const newPreset: ContentPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      subtitle: newPresetSubtitle || "Custom preset",
      thumbnail: newPresetThumbnail || "/custom-preset.jpg",
      promptSnippet: newPresetSnippet,
      description: newPresetDescription || "Custom user-created preset",
      category: "Custom",
    }

    addCustomPreset(newPreset)
    reorderPresets([newPreset.id, ...presetOrder])
    toast.success("Custom preset created!")

    setNewPresetName("")
    setNewPresetSubtitle("")
    setNewPresetSnippet("")
    setNewPresetDescription("")
    setNewPresetThumbnail("")
    setIsDialogOpen(false)
  }

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, id: string) => {
    e.dataTransfer.effectAllowed = "move"
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetId: string) => {
    e.preventDefault()
    const draggedId = draggedItem
    if (draggedId && draggedId !== targetId) {
      const newOrder = presetOrder.filter((id) => id !== draggedId)
      const targetIndex = newOrder.indexOf(targetId)
      newOrder.splice(targetIndex + 1, 0, draggedId)
      reorderPresets(newOrder)
    }
    setDraggedItem(null)
  }

  // Fullscreen View
  if (isPresetsFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-border p-4 sm:p-6">
            <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#00b4ff] to-[#ffb347] bg-clip-text text-transparent">
                  Content Presets
                </h2>
                <Badge variant="outline" className="text-xs">
                  {sortedPresets.length} available
                </Badge>
                <Badge variant="outline" className="text-xs bg-[#00b4ff]/20 text-[#00b4ff] border-[#00b4ff]/30">
                  {selectedPresets.length} selected
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 bg-secondary border-border"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetsFullscreen(false)}
                  className="gap-2 bg-secondary border-border hover:bg-secondary/80"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Collapse</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <TooltipProvider delayDuration={300}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {/* Create Custom Button */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="rounded-lg border-2 border-dashed border-[#00b4ff]/50 hover:border-[#00b4ff] hover:bg-[#00b4ff]/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square min-h-[140px]">
                        <Plus className="w-8 h-8 text-[#00b4ff]" />
                        <span className="text-sm font-medium text-[#00b4ff]">Create</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-card-foreground">Create Custom Preset</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="preset-name" className="text-muted-foreground">
                            Preset Name
                          </Label>
                          <Input
                            id="preset-name"
                            placeholder="e.g., Newsletter Hook"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="bg-secondary border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preset-subtitle" className="text-muted-foreground">
                            Subtitle (optional)
                          </Label>
                          <Input
                            id="preset-subtitle"
                            placeholder="e.g., Engaging openers"
                            value={newPresetSubtitle}
                            onChange={(e) => setNewPresetSubtitle(e.target.value)}
                            className="bg-secondary border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preset-snippet" className="text-muted-foreground">
                            Prompt Snippet
                          </Label>
                          <Textarea
                            id="preset-snippet"
                            placeholder="e.g., Start with a compelling hook, use curiosity, ask questions..."
                            value={newPresetSnippet}
                            onChange={(e) => setNewPresetSnippet(e.target.value)}
                            className="min-h-[80px] bg-secondary border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preset-description" className="text-muted-foreground">
                            Description (optional)
                          </Label>
                          <Textarea
                            id="preset-description"
                            placeholder="Describe what this preset does..."
                            value={newPresetDescription}
                            onChange={(e) => setNewPresetDescription(e.target.value)}
                            className="min-h-[60px] bg-secondary border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Thumbnail (optional)</Label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                            id="preset-thumbnail"
                          />
                          {newPresetThumbnail ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                              <img
                                src={newPresetThumbnail || "/placeholder.svg"}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => setNewPresetThumbnail("")}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-red-600/70"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor="preset-thumbnail"
                              className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-[#00b4ff]/50 hover:bg-[#00b4ff]/5 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                            </label>
                          )}
                        </div>

                        <Button
                          onClick={handleCreatePreset}
                          className="w-full bg-gradient-to-r from-[#0077b5] to-[#00a0dc] hover:from-[#0077b5]/90 hover:to-[#00a0dc]/90 text-white font-semibold"
                        >
                          Create Preset
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Presets Grid */}
                  {sortedPresets.map((preset) => (
                    <ContentPresetCard
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresets.includes(preset.id)}
                      isCustom={preset.id.startsWith("custom-")}
                      order={selectedPresets.indexOf(preset.id) + 1}
                      advancedMode={advancedMode}
                      draggedItem={draggedItem}
                      onToggle={() => togglePreset(preset.id)}
                      onDelete={() => removeCustomPreset(preset.id)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      fullscreen
                    />
                  ))}
                </div>

                {sortedPresets.length === 0 && searchQuery && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No presets found for "{searchQuery}"</p>
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-[#00b4ff] hover:text-[#00b4ff]/80"
                    >
                      Clear search
                    </Button>
                  </div>
                )}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Collapsed View (Horizontal Scroll)
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Content Presets</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            onClick={() => setPresetsExpanded(!isPresetsExpanded)}
          >
            {isPresetsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            onClick={() => setPresetsFullscreen(true)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {selectedPresets.length} selected
          </Badge>
          <button
            onClick={() => setAdvancedMode(!advancedMode)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {advancedMode ? "Multi-select" : "Single"}
          </button>
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        {!isPresetsExpanded ? (
          // Horizontal Scroll (Collapsed)
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
            {/* Create Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex-shrink-0 w-24 sm:w-28 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square">
                  <Plus className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-primary">Custom</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">Create Custom Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name" className="text-muted-foreground">
                      Preset Name
                    </Label>
                    <Input
                      id="preset-name"
                      placeholder="e.g., Newsletter Hook"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-snippet" className="text-muted-foreground">
                      Prompt Snippet
                    </Label>
                    <Textarea
                      id="preset-snippet"
                      placeholder="e.g., Start with compelling hooks..."
                      value={newPresetSnippet}
                      onChange={(e) => setNewPresetSnippet(e.target.value)}
                      className="min-h-[80px] bg-secondary border-border"
                    />
                  </div>

                  <Button
                    onClick={handleCreatePreset}
                    className="w-full bg-gradient-to-r from-[#0077b5] to-[#00a0dc] hover:from-[#0077b5]/90 hover:to-[#00a0dc]/90 text-white font-semibold"
                  >
                    Create Preset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Preset Cards */}
            {sortedPresets.map((preset) => (
              <div key={preset.id} className="flex-shrink-0 w-24 sm:w-28">
                <ContentPresetCard
                  preset={preset}
                  isSelected={selectedPresets.includes(preset.id)}
                  isCustom={preset.id.startsWith("custom-")}
                  advancedMode={advancedMode}
                  draggedItem={draggedItem}
                  onToggle={() => togglePreset(preset.id)}
                  onDelete={() => removeCustomPreset(preset.id)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
            ))}
          </div>
        ) : (
          // Grid View (Expanded)
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {/* Create Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square">
                  <Plus className="w-8 h-8 text-primary" />
                  <span className="text-sm font-medium text-primary">Create</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">Create Custom Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name" className="text-muted-foreground">
                      Preset Name
                    </Label>
                    <Input
                      id="preset-name"
                      placeholder="e.g., Newsletter Hook"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-subtitle" className="text-muted-foreground">
                      Subtitle (optional)
                    </Label>
                    <Input
                      id="preset-subtitle"
                      placeholder="e.g., Engaging openers"
                      value={newPresetSubtitle}
                      onChange={(e) => setNewPresetSubtitle(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-snippet" className="text-muted-foreground">
                      Prompt Snippet
                    </Label>
                    <Textarea
                      id="preset-snippet"
                      placeholder="e.g., Start with a compelling hook, use curiosity, ask questions..."
                      value={newPresetSnippet}
                      onChange={(e) => setNewPresetSnippet(e.target.value)}
                      className="min-h-[80px] bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-description" className="text-muted-foreground">
                      Description (optional)
                    </Label>
                    <Textarea
                      id="preset-description"
                      placeholder="Describe what this preset does..."
                      value={newPresetDescription}
                      onChange={(e) => setNewPresetDescription(e.target.value)}
                      className="min-h-[60px] bg-secondary border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Thumbnail (optional)</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      id="preset-thumbnail"
                    />
                    {newPresetThumbnail ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                        <img
                          src={newPresetThumbnail || "/placeholder.svg"}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setNewPresetThumbnail("")}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-red-600/70"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="preset-thumbnail"
                        className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                      </label>
                    )}
                  </div>

                  <Button
                    onClick={handleCreatePreset}
                    className="w-full bg-gradient-to-r from-[#0077b5] to-[#00a0dc] hover:from-[#0077b5]/90 hover:to-[#00a0dc]/90 text-white font-semibold"
                  >
                    Create Preset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Preset Cards */}
            {sortedPresets.map((preset) => (
              <ContentPresetCard
                key={preset.id}
                preset={preset}
                isSelected={selectedPresets.includes(preset.id)}
                isCustom={preset.id.startsWith("custom-")}
                order={selectedPresets.indexOf(preset.id) + 1}
                advancedMode={advancedMode}
                draggedItem={draggedItem}
                onToggle={() => togglePreset(preset.id)}
                onDelete={() => removeCustomPreset(preset.id)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}

        {sortedPresets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No presets available yet. Create your first custom preset!</p>
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}
