// lib/content-preset-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ContentPreset {
  id: string
  name: string              // e.g. "Thought Leadership", "Quick Tips"
  subtitle: string          // Short phrase below title
  thumbnail?: string        // Optional image URL
  description: string       // one-sentence explanation
  promptSnippet: string     // text appended to final prompt
  category?: string         // "Storytelling", "Educational", "Engagement", "Custom"
}

export const PRESETS: ContentPreset[] = [
  {
    id: "thought-leadership",
    name: "Thought Leadership",
    subtitle: "Insights & Opinions",
    description: "Deep insights & expert opinions",
    promptSnippet: "Write in confident thought-leadership tone, share original strategic insight, position author as industry expert",
    category: "Authority",
  },
  {
    id: "quick-tips",
    name: "Quick Tips",
    subtitle: "Actionable Advice",
    description: "Numbered actionable advice",
    promptSnippet: "Format as concise numbered list of 5–7 practical, immediately implementable tips",
    category: "Educational",
  },
  {
    id: "personal-story",
    name: "Personal Story",
    subtitle: "Vulnerable & Real",
    description: "Relatable anecdote + lessons",
    promptSnippet: "Start with short vulnerable personal story or failure, extract 2–3 clear lessons, close with inspiring takeaway",
    category: "Storytelling",
  },
  {
    id: "controversial-take",
    name: "Bold Opinion",
    subtitle: "Spark Debate",
    description: "Provocative view that sparks debate",
    promptSnippet: "Share strong, slightly controversial opinion on [topic], support with clear reasoning, invite discussion",
    category: "Engagement",
  },
  {
    id: "case-study",
    name: "Mini Case Study",
    subtitle: "Proven Results",
    description: "Before → Strategy → Result",
    promptSnippet: "Structure as mini case study: challenge → key decision/strategy → measurable result + lesson",
    category: "Proof",
  },
  {
    id: "question-hook",
    name: "Question Hook",
    subtitle: "Drive Comments",
    description: "Engage with powerful question",
    promptSnippet: "Start with thought-provoking question that challenges reader assumptions, then deliver value",
    category: "Engagement",
  },
  {
    id: "list-post",
    name: "List Format",
    subtitle: "Easy to Read",
    description: "Numbered or bulleted value",
    promptSnippet: "Write in numbered list format, each point clear, actionable and valuable",
    category: "Educational",
  },
  {
    id: "behind-scenes",
    name: "Behind the Scenes",
    subtitle: "Transparent Process",
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
  isPresetsFullscreen: boolean
  presetOrder: string[]

  togglePreset: (id: string) => void
  setAdvancedMode: (mode: boolean) => void
  addCustomPreset: (preset: ContentPreset) => void
  removeCustomPreset: (id: string) => void
  setPresetsExpanded: (expanded: boolean) => void
  setPresetsFullscreen: (fullscreen: boolean) => void
  reorderPresets: (order: string[]) => void
}

export const useContentPresetStore = create<ContentPresetState>()(
  persist(
    (set, get) => ({
      selectedPresets: [],
      advancedMode: true,
      customPresets: [],
      isPresetsExpanded: false,
      isPresetsFullscreen: false,
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
      setPresetsFullscreen: fullscreen => set({ isPresetsFullscreen: fullscreen }),

      reorderPresets: order => set({ presetOrder: order }),
    }),
    {
      name: 'maxis-content-presets-v2',
      partialize: state => ({
        customPresets: state.customPresets,
        presetOrder: state.presetOrder,
        advancedMode: state.advancedMode
      })
    }
  )
)