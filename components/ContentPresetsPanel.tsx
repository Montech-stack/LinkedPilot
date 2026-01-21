// components/PresetsPanel.tsx
"use client"

import React, { useState, useMemo } from "react"
import {
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
  X,
  GripHorizontal,
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
import { toast } from "sonner"

export function PresetsPanel() {
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
    presetOrder,
    reorderPresets,
  } = useContentPresetStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSnippet, setNewSnippet] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const allPresets = [...customPresets, ...PRESETS]

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return allPresets
    const q = searchQuery.toLowerCase()
    return allPresets.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.promptSnippet.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
  }, [searchQuery, allPresets])

  const sortedPresets = filteredPresets.sort((a, b) => {
    const aIdx = presetOrder.indexOf(a.id)
    const bIdx = presetOrder.indexOf(b.id)
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })

  const handleCreatePreset = () => {
    if (!newName.trim() || !newSnippet.trim()) {
      toast.error("Name and prompt snippet are required")
      return
    }

    const newPreset = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "Custom content style",
      promptSnippet: newSnippet.trim(),
      category: "Custom",
    }

    addCustomPreset(newPreset)
    reorderPresets([newPreset.id, ...presetOrder.filter(id => id !== newPreset.id)])
    toast.success("Preset created")

    setNewName("")
    setNewSnippet("")
    setNewDesc("")
    setIsDialogOpen(false)
  }

  const PresetCard = ({ preset }: { preset: typeof PRESETS[number] }) => {
    const isSelected = selectedPresets.includes(preset.id)
    const isCustom = preset.id.startsWith("custom-")

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => togglePreset(preset.id)}
            className={cn(
              "group relative flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-all min-w-[180px] max-w-[220px]",
              isSelected
                ? "border-blue-500/70 bg-blue-950/30 shadow-sm"
                : "border-border hover:border-muted-foreground/70 hover:bg-muted/40"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm leading-tight">{preset.name}</span>
              {isSelected && (
                <Check className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">
              {preset.description}
            </p>

            {preset.category && (
              <Badge variant="outline" className="text-[10px] mt-1 w-fit">
                {preset.category}
              </Badge>
            )}

            {isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeCustomPreset(preset.id)
                  toast.success("Preset removed")
                }}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
              </button>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="space-y-2 text-xs">
            <p className="font-medium">{preset.name}</p>
            <p className="text-muted-foreground">{preset.description}</p>
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1">Adds to prompt:</p>
              <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded break-words block">
                {preset.promptSnippet}
              </code>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Content Styles & Angles</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPresetsExpanded(!isPresetsExpanded)}
          >
            {isPresetsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs px-2 py-0">
            {selectedPresets.length} active
          </Badge>
          <button
            onClick={() => setAdvancedMode(!advancedMode)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {advancedMode ? "Multi" : "Single"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search styles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-9 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      <TooltipProvider delayDuration={400}>
        {!isPresetsExpanded ? (
          // Horizontal scroll – compact cards
          <div className="relative">
            <div className={cn(
              "flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory",
              "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/70"
            )}>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex-shrink-0 w-[180px] rounded-lg border-2 border-dashed border-muted-foreground/40 hover:border-primary/60 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center py-4 gap-1.5">
                    <Plus className="h-5 w-5 text-primary/70" />
                    <span className="text-xs font-medium text-primary/80">New Style</span>
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>New Content Style / Angle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm">Name</Label>
                      <Input
                        id="name"
                        placeholder="Thought Leadership, Behind-the-Scenes, Quick Tips..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="snippet" className="text-sm">Prompt addition</Label>
                      <Textarea
                        id="snippet"
                        placeholder="e.g. educational tone, numbered list, actionable advice, professional yet approachable"
                        value={newSnippet}
                        onChange={e => setNewSnippet(e.target.value)}
                        className="min-h-[70px] text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="desc" className="text-sm">Short description (optional)</Label>
                      <Input
                        id="desc"
                        placeholder="Short posts with practical tips"
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                      />
                    </div>

                    <Button onClick={handleCreatePreset} className="w-full mt-2">
                      Create Style
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {sortedPresets.map(preset => (
                <PresetCard key={preset.id} preset={preset} />
              ))}
            </div>
          </div>
        ) : (
          // Expanded grid view
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="rounded-lg border-2 border-dashed border-muted-foreground/40 hover:border-primary/60 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center py-6 gap-2">
                  <Plus className="h-6 w-6 text-primary/70" />
                  <span className="text-sm font-medium text-primary/80">New Content Style</span>
                </button>
              </DialogTrigger>
              {/* same DialogContent as above */}
              <DialogContent className="sm:max-w-md">
                {/* ... same form content ... */}
              </DialogContent>
            </Dialog>

            {sortedPresets.map(preset => (
              <PresetCard key={preset.id} preset={preset} />
            ))}
          </div>
        )}

        {filteredPresets.length === 0 && searchQuery && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No matching styles found for "{searchQuery}"
            <Button variant="link" size="sm" onClick={() => setSearchQuery("")} className="ml-2">
              Clear
            </Button>
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}