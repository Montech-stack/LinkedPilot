// lib/content-preset-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ContentPreset {
  id: string
  name: string              // e.g. "Thought Leadership", "Quick Tips"
  description: string       // one-sentence explanation
  promptSnippet: string     // text appended to final prompt
  category?: string         // "Storytelling", "Educational", "Engagement", "Custom"
}

export const PRESETS: ContentPreset[] = [
  {
    id: "thought-leadership",
    name: "Thought Leadership",
    description: "Deep insights & expert opinions",
    promptSnippet: "Write in confident thought-leadership tone, share original strategic insight, position author as industry expert",
    category: "Authority",
  },
  {
    id: "quick-tips",
    name: "Quick Tips",
    description: "Numbered actionable advice",
    promptSnippet: "Format as concise numbered list of 5–7 practical, immediately implementable tips",
    category: "Educational",
  },
  {
    id: "personal-story",
    name: "Personal Story",
    description: "Relatable anecdote + lessons",
    promptSnippet: "Start with short vulnerable personal story or failure, extract 2–3 clear lessons, close with inspiring takeaway",
    category: "Storytelling",
  },
  {
    id: "controversial-take",
    name: "Bold Opinion",
    description: "Provocative view that sparks debate",
    promptSnippet: "Share strong, slightly controversial opinion on [topic], support with clear reasoning, invite discussion",
    category: "Engagement",
  },
  {
    id: "case-study",
    name: "Mini Case Study",
    description: "Before → Strategy → Result",
    promptSnippet: "Structure as mini case study: challenge → key decision/strategy → measurable result + lesson",
    category: "Proof",
  },
  {
    id: "question-hook",
    name: "Question Hook",
    description: "Engage with powerful question",
    promptSnippet: "Start with thought-provoking question that challenges reader assumptions, then deliver value",
    category: "Engagement",
  },
  {
    id: "list-post",
    name: "List Format",
    description: "Numbered or bulleted value",
    promptSnippet: "Write in numbered list format, each point clear, actionable and valuable",
    category: "Educational",
  },
  {
    id: "behind-scenes",
    name: "Behind the Scenes",
    description: "Show the real process",
    promptSnippet: "Share transparent behind-the-scenes look at process, challenges and decisions",
    category: "Authenticity",
  },
]

interface ContentPresetState {
  selectedPresets: string[]
  advancedMode: boolean           // true = multi-select, false = single-select
  customPresets: ContentPreset[]
  isPresetsExpanded: boolean
  presetOrder: string[]

  togglePreset: (id: string) => void
  setAdvancedMode: (mode: boolean) => void
  addCustomPreset: (preset: ContentPreset) => void
  removeCustomPreset: (id: string) => void
  setPresetsExpanded: (expanded: boolean) => void
  reorderPresets: (order: string[]) => void
}

export const useContentPresetStore = create<ContentPresetState>()(
  persist(
    (set, get) => ({
      selectedPresets: [],
      advancedMode: true,
      customPresets: [],
      isPresetsExpanded: false,
      presetOrder: PRESETS.map(p => p.id),

      togglePreset: (id) =>
        set(state => {
          if (!state.advancedMode) {
            // single select
            return { selectedPresets: state.selectedPresets.includes(id) ? [] : [id] }
          }
          // multi select
          return {
            selectedPresets: state.selectedPresets.includes(id)
              ? state.selectedPresets.filter(p => p !== id)
              : [...state.selectedPresets, id]
          }
        }),

      setAdvancedMode: mode => set({ advancedMode: mode }),

      addCustomPreset: preset =>
        set(state => ({
          customPresets: [...state.customPresets, preset],
          presetOrder: [preset.id, ...state.presetOrder]
        })),

      removeCustomPreset: id =>
        set(state => ({
          customPresets: state.customPresets.filter(p => p.id !== id),
          selectedPresets: state.selectedPresets.filter(p => p !== id),
          presetOrder: state.presetOrder.filter(p => p !== id)
        })),

      setPresetsExpanded: expanded => set({ isPresetsExpanded: expanded }),

      reorderPresets: order => set({ presetOrder: order }),
    }),
    {
      name: 'maxis-content-presets',
      partialize: state => ({
        customPresets: state.customPresets,
        presetOrder: state.presetOrder,
        advancedMode: state.advancedMode
      })
    }
  )
)