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
    promptSnippet: "Write as an industry authority sharing a unique perspective. Open with a bold statement that challenges conventional wisdom. Support with evidence from experience. Use confident language without arrogance. End with a forward-looking insight that positions the author as ahead of the curve.",
    category: "Authority",
  },
  {
    id: "quick-tips",
    name: "Quick Tips",
    description: "Numbered actionable advice",
    promptSnippet: "Create a numbered list of 5-7 actionable tips. Each tip should be specific enough to implement today. Start each point with an action verb. Keep explanations to one sentence. The tips should progress logically and build on each other.",
    category: "Educational",
  },
  {
    id: "personal-story",
    name: "Personal Story",
    description: "Relatable anecdote + lessons",
    promptSnippet: "Share a vulnerable personal moment - a failure, challenge, or turning point. Be specific about the situation and emotions. Extract 2-3 clear lessons that readers can apply. Close with an inspiring but realistic takeaway. Write in first person with raw honesty.",
    category: "Storytelling",
  },
  {
    id: "controversial-take",
    name: "Bold Opinion",
    description: "Provocative view that sparks debate",
    promptSnippet: "Take a strong stance on a topic most people disagree with or avoid discussing. Open with the controversial opinion directly. Support with logical reasoning and specific examples. Acknowledge the opposing view briefly. Invite respectful debate with a thought-provoking question at the end.",
    category: "Engagement",
  },
  {
    id: "case-study",
    name: "Mini Case Study",
    description: "Before → Strategy → Result",
    promptSnippet: "Structure as a mini case study with three clear parts: the Challenge (specific problem and context), the Strategy (what was done differently), and the Result (measurable outcome with numbers if possible). Keep it concise. End with a universal lesson others can apply.",
    category: "Proof",
  },
  {
    id: "question-hook",
    name: "Question Hook",
    description: "Engage with powerful question",
    promptSnippet: "Open with a provocative question that challenges assumptions or creates curiosity. Make it specific enough to resonate deeply. Follow with valuable insight that answers or expands on the question. End with an invitation for readers to share their perspective in the comments.",
    category: "Engagement",
  },
  {
    id: "list-post",
    name: "List Format",
    description: "Numbered or bulleted value",
    promptSnippet: "Format as a clean numbered list for easy scanning. Each point should deliver standalone value. Use parallel structure across all points. Start with the most compelling point to hook readers. Keep each point focused on one clear idea.",
    category: "Educational",
  },
  {
    id: "behind-scenes",
    name: "Behind the Scenes",
    description: "Show the real process",
    promptSnippet: "Pull back the curtain on a process, decision, or journey that usually stays hidden. Be specific about the messy reality, including mistakes and pivots. Share what you learned that you would do differently. Make readers feel like insiders getting exclusive access.",
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
      isPresetsExpanded: true,
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