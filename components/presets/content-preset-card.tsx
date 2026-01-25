"use client"

import type React from "react"
import { Check, Trash2, GripHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ContentPreset } from "@/lib/content-preset-store"

interface ContentPresetCardProps {
  preset: ContentPreset
  isSelected: boolean
  isCustom: boolean
  order?: number
  advancedMode?: boolean
  draggedItem?: string | null
  onToggle: () => void
  onDelete?: () => void
  onDragStart?: (e: React.DragEvent<HTMLButtonElement>, id: string) => void
  onDragOver?: (e: React.DragEvent<HTMLButtonElement>) => void
  onDrop?: (e: React.DragEvent<HTMLButtonElement>, id: string) => void
  fullscreen?: boolean
}

export function ContentPresetCard({
  preset,
  isSelected,
  isCustom,
  order,
  advancedMode = false,
  draggedItem = null,
  onToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  fullscreen = false,
}: ContentPresetCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            draggable
            onDragStart={(e) => onDragStart?.(e, preset.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop?.(e, preset.id)}
            onClick={onToggle}
            className={cn(
              "group relative transition-all rounded-lg border-2",
              isSelected
                ? "border-primary bg-primary/10"
                : "border-gray-200 dark:border-border bg-white dark:bg-card hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-primary/5",
              draggedItem === preset.id && "opacity-50",
            )}
          >
            {/* Drag Handle */}
            {advancedMode && (
              <GripHorizontal className="absolute left-2 top-2 w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground" />
            )}

            {/* Thumbnail */}
            <div className="relative w-full aspect-square overflow-hidden rounded-t-[calc(var(--radius)-2px)]">
              <img
                src={preset.thumbnail || "/placeholder.svg?height=200&width=200"}
                alt={preset.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=200"
                }}
              />
              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-2 space-y-1">
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-foreground truncate">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{preset.subtitle}</p>
                </div>
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.()
                    }}
                    className="flex-shrink-0 p-1 rounded hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-destructive/70 hover:text-destructive" />
                  </button>
                )}
              </div>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{preset.name}</p>
            <p className="text-xs text-muted-foreground">{preset.description}</p>
            {order && order > 0 && <p className="text-xs text-primary mt-2">Order: {order}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
