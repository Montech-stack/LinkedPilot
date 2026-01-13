// lib/content-preset-store.ts
import { create } from 'zustand';
import { Preset } from '@/types'; // Assume you add this or define inline

export const PRESETS: Preset[] = [
  {
    id: 'personal-story',
    name: 'Personal Story',
    subtitle: 'Share vulnerable experiences',
    thumbnail: '📖', // Using emoji as thumbnail
    promptSnippet: 'Write a vulnerable post about a failure I experienced in my career and the 3 key lessons I learned from it.',
    description: 'Craft engaging personal narratives that connect with your audience on a deeper level.',
    category: 'Storytelling',
  },
  {
    id: 'actionable-tips',
    name: 'Actionable Tips',
    subtitle: 'Practical quick wins',
    thumbnail: '💡',
    promptSnippet: 'Give me 5 actionable tips for [Insert Topic] that someone can implement in less than 10 minutes.',
    description: 'Provide bite-sized, implementable advice to help your audience achieve immediate results.',
    category: 'Educational',
  },
  {
    id: 'controversial-take',
    name: 'Controversial Take',
    subtitle: 'Challenge the status quo',
    thumbnail: '🔥',
    promptSnippet: 'Share a contrarian opinion about [Insert Industry] that challenges the status quo, and explain why.',
    description: 'Spark discussions with bold, thought-provoking opinions that stand out in feeds.',
    category: 'Opinion',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    subtitle: 'Break down successes',
    thumbnail: '📈',
    promptSnippet: 'Break down a recent success story where we achieved [Result] by focusing on [Strategy].',
    description: 'Showcase real-world examples and strategies to demonstrate expertise and value.',
    category: 'Business',
  },
];

export interface Preset {
  id: string;
  name: string;
  subtitle: string;
  thumbnail: string; // Can be emoji or image URL
  promptSnippet: string;
  description: string;
  category?: string;
}

interface ContentPresetStore {
  selectedPresets: string[];
  togglePreset: (id: string) => void;
  advancedMode: boolean;
  setAdvancedMode: (mode: boolean) => void;
  customPresets: Preset[];
  addCustomPreset: (preset: Preset) => void;
  removeCustomPreset: (id: string) => void;
  isPresetsExpanded: boolean;
  setPresetsExpanded: (expanded: boolean) => void;
  isPresetsFullscreen: boolean;
  setPresetsFullscreen: (fullscreen: boolean) => void;
  presetOrder: string[];
  reorderPresets: (order: string[]) => void;
}

export const useContentPresetStore = create<ContentPresetStore>((set, get) => ({
  selectedPresets: [],
  togglePreset: (id) => set((state) => {
    if (!state.advancedMode) {
      return {
        selectedPresets: state.selectedPresets.includes(id) ? [] : [id],
      };
    } else {
      return {
        selectedPresets: state.selectedPresets.includes(id)
          ? state.selectedPresets.filter((p) => p !== id)
          : [...state.selectedPresets, id],
      };
    }
  }),
  advancedMode: false, // Default to single select for content creation
  setAdvancedMode: (mode) => set({ advancedMode: mode }),
  customPresets: [],
  addCustomPreset: (preset) => set((state) => ({ customPresets: [...state.customPresets, preset] })),
  removeCustomPreset: (id) => set((state) => ({
    customPresets: state.customPresets.filter((p) => p.id !== id),
  })),
  isPresetsExpanded: true,
  setPresetsExpanded: (expanded) => set({ isPresetsExpanded: expanded }),
  isPresetsFullscreen: false,
  setPresetsFullscreen: (fullscreen) => set({ isPresetsFullscreen: fullscreen }),
  presetOrder: PRESETS.map((p) => p.id),
  reorderPresets: (order) => set({ presetOrder: order }),
}));