"use client"

import type React from "react"
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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useContentPresetStore, PRESETS } from "@/lib/content-preset-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState, useRef, useMemo } from "react"
import { toast } from "sonner"

function PresetsPanel() {
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

    const newPreset = {
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
      reorderPresets(newOrder)
    }
    setDraggedItem(null)
  }

  const PresetCard = ({ preset }: { preset: (typeof PRESETS)[0] }) => {
    const isSelected = selectedPresets.includes(preset.id)
    const order = selectedPresets.indexOf(preset.id) + 1
    const isCustom = preset.id.startsWith("custom-")

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            draggable
            onDragStart={(e) => handleDragStart(e, preset.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, preset.id)}
            onClick={() => togglePreset(preset.id)}
            className={cn(
              "group relative",
              "rounded-lg border-2 transition-all",
              draggedItem === preset.id ? "opacity-50" : "",
              isSelected ? "gradient-border shadow-lg" : "border-border hover:border-muted-foreground",
            )}
          >
            <div className="aspect-square rounded-t-md overflow-hidden bg-secondary relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                <GripHorizontal className="w-5 h-5 text-white" />
              </div>
              <img
                src={preset.thumbnail || "/placeholder.svg"}
                alt={preset.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-2 bg-card rounded-b-md">
              <p className="text-xs font-medium text-balance leading-tight">{preset.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{preset.subtitle}</p>
              {preset.category && (
                <Badge variant="secondary" className="text-[9px] mt-1 px-1 py-0">
                  {preset.category}
                </Badge>
              )}
            </div>

            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-[var(--gradient-orange)] to-[var(--gradient-blue)] flex items-center justify-center shadow-lg">
                {advancedMode && order > 0 ? (
                  <span className="text-xs font-bold text-white">{order}</span>
                ) : (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
              </div>
            )}

            {isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeCustomPreset(preset.id)
                  toast.success("Custom preset removed")
                }}
                className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            )}

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Info className="w-3 h-3 text-white" />
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="text-xs font-semibold">{preset.name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{preset.description}</p>
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1">Adds to prompt:</p>
              <code className="text-[10px] bg-secondary px-2 py-1 rounded block">{preset.promptSnippet}</code>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (isPresetsFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="h-full flex flex-col">
          {/* Fullscreen Header */}
          <div className="border-b border-border p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold gradient-text">All Content Presets</h2>
                <Badge variant="secondary">{sortedPresets.length} available</Badge>
                <Badge variant="outline">{selectedPresets.length} selected</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={() => setPresetsFullscreen(false)} className="gap-2">
                  <Minimize2 className="w-4 h-4" />
                  Collapse
                </Button>
              </div>
            </div>
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-7xl mx-auto">
              <TooltipProvider delayDuration={300}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {/* Custom Preset Button First */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="rounded-lg border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square min-h-[140px]">
                        <Plus className="w-8 h-8 text-primary" />
                        <span className="text-sm font-medium text-primary">Create Custom</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Custom Preset</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="preset-name">Preset Name</Label>
                          <Input
                            id="preset-name"
                            placeholder="e.g., Motivational Quote"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preset-subtitle">Subtitle (optional)</Label>
                          <Input
                            id="preset-subtitle"
                            placeholder="e.g., Inspiring content"
                            value={newPresetSubtitle}
                            onChange={(e) => setNewPresetSubtitle(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preset-snippet">Prompt Snippet</Label>
                          <Textarea
                            id="preset-snippet"
                            placeholder="e.g., inspirational tone, engaging narrative, positive message"
                            value={newPresetSnippet}
                            onChange={(e) => setNewPresetSnippet(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preset-description">Description (optional)</Label>
                          <Textarea
                            id="preset-description"
                            placeholder="Describe what this preset does..."
                            value={newPresetDescription}
                            onChange={(e) => setNewPresetDescription(e.target.value)}
                            className="min-h-[60px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Thumbnail (optional)</Label>
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
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor="preset-thumbnail"
                              className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-chart-1 hover:bg-secondary/50 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                            </label>
                          )}
                        </div>

                        <Button onClick={handleCreatePreset} className="w-full">
                          Create Preset
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* All Presets */}
                  {sortedPresets.map((preset) => (
                    <PresetCard key={preset.id} preset={preset} />
                  ))}
                </div>

                {sortedPresets.length === 0 && searchQuery && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No presets found for "{searchQuery}"</p>
                    <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
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

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium gradient-text">Content Presets</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPresetsExpanded(!isPresetsExpanded)}
          >
            {isPresetsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPresetsFullscreen(true)}>
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
            {advancedMode ? "Multi-select" : "Single-select"}
          </button>
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        {!isPresetsExpanded ? (
          // Collapsed: Horizontal scroll view
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
            {/* Custom Preset Button First */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex-shrink-0 w-24 sm:w-28 rounded-lg border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square">
                  <Plus className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-primary">Custom</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Custom Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Preset Name</Label>
                    <Input
                      id="preset-name"
                      placeholder="e.g., Motivational Quote"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-subtitle">Subtitle (optional)</Label>
                    <Input
                      id="preset-subtitle"
                      placeholder="e.g., Inspiring content"
                      value={newPresetSubtitle}
                      onChange={(e) => setNewPresetSubtitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-snippet">Prompt Snippet</Label>
                    <Textarea
                      id="preset-snippet"
                      placeholder="e.g., inspirational tone, engaging narrative, positive message"
                      value={newPresetSnippet}
                      onChange={(e) => setNewPresetSnippet(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-description">Description (optional)</Label>
                    <Textarea
                      id="preset-description"
                      placeholder="Describe what this preset does..."
                      value={newPresetDescription}
                      onChange={(e) => setNewPresetDescription(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thumbnail (optional)</Label>
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
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="preset-thumbnail"
                        className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-chart-1 hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                      </label>
                    )}
                  </div>

                  <Button onClick={handleCreatePreset} className="w-full">
                    Create Preset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {sortedPresets.slice(0, 10).map((preset) => (
              <div key={preset.id} className="flex-shrink-0 w-24 sm:w-28">
                <PresetCard preset={preset} />
              </div>
            ))}

            {/* Show more button */}
            <button
              onClick={() => setPresetsFullscreen(true)}
              className="flex-shrink-0 w-24 sm:w-28 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground hover:bg-secondary/50 transition-all flex flex-col items-center justify-center gap-2 aspect-square"
            >
              <Maximize2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">View All</span>
              <span className="text-[10px] text-muted-foreground">({allPresets.length}+)</span>
            </button>
          </div>
        ) : (
          // Expanded: Grid view
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {/* Custom Preset Button First */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="rounded-lg border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 aspect-square">
                  <Plus className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-primary">Create Custom</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Custom Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Preset Name</Label>
                    <Input
                      id="preset-name"
                      placeholder="e.g., Motivational Quote"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-subtitle">Subtitle (optional)</Label>
                    <Input
                      id="preset-subtitle"
                      placeholder="e.g., Inspiring content"
                      value={newPresetSubtitle}
                      onChange={(e) => setNewPresetSubtitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-snippet">Prompt Snippet</Label>
                    <Textarea
                      id="preset-snippet"
                      placeholder="e.g., inspirational tone, engaging narrative, positive message"
                      value={newPresetSnippet}
                      onChange={(e) => setNewPresetSnippet(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset-description">Description (optional)</Label>
                    <Textarea
                      id="preset-description"
                      placeholder="Describe what this preset does..."
                      value={newPresetDescription}
                      onChange={(e) => setNewPresetDescription(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thumbnail (optional)</Label>
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
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="preset-thumbnail"
                        className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-chart-1 hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                      </label>
                    )}
                  </div>

                  <Button onClick={handleCreatePreset} className="w-full">
                    Create Preset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {sortedPresets.map((preset) => (
              <PresetCard key={preset.id} preset={preset} />
            ))}
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}

