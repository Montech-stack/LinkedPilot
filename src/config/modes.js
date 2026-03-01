import { Search, BookOpen, Lightbulb, ClipboardList, Link2, RefreshCcw, Rocket, Database } from 'lucide-react';

/**
 * UI-only mode metadata.
 * All prompt logic lives server-side in api/_lib/prompts.js — never here.
 */
export const MODES = {
    research: {
        id: 'research',
        label: 'Research',
        icon: 'Search',
        emoji: '🔬',
        description: 'Explore any topic broadly and discover all its facets',
        color: 'var(--accent-cyan)',
        categories: ['Foundation', 'Applications', 'Challenges', 'Trends', 'Key Players', 'Future Outlook'],
    },
    learning: {
        id: 'learning',
        label: 'Learning Path',
        icon: 'BookOpen',
        emoji: '📚',
        description: 'Structured beginner-to-expert learning journey',
        color: 'var(--accent-green)',
        categories: ['Prerequisites', 'Core Concepts', 'Intermediate', 'Advanced', 'Practice Projects', 'Mastery Path'],
    },
    brainstorm: {
        id: 'brainstorm',
        label: 'Brainstorm',
        icon: 'Lightbulb',
        emoji: '💡',
        description: 'Creative ideation and problem-solving framework',
        color: 'var(--accent-orange)',
        categories: ['Problem Statement', 'Wild Ideas', 'Feasible Solutions', 'Unique Angles', 'Combinations', 'Action Steps'],
    },
    study: {
        id: 'study',
        label: 'Study Guide',
        icon: 'ClipboardList',
        emoji: '🗺️',
        description: 'Exam-ready study material with key concepts and practice',
        color: 'var(--accent-purple)',
        categories: ['Key Definitions', 'Core Theories', 'Important Formulas', 'Common Mistakes', 'Practice Questions', 'Quick Review'],
    },
    connect: {
        id: 'connect',
        label: 'Connect',
        icon: 'Link2',
        emoji: '🔗',
        description: 'Discover surprising connections between any two topics',
        color: 'var(--accent-pink)',
        categories: ['Shared Foundations', 'Parallel Concepts', 'Cross Applications', 'Key Differences', 'Synthesis Ideas', 'Combined Future'],
    },
    revision: {
        id: 'revision',
        label: 'Revision',
        icon: 'RefreshCcw',
        emoji: '🔄',
        description: 'Quick-fire revision cards to test and reinforce your knowledge',
        color: 'var(--accent-yellow)',
        categories: ['Must-Know Facts', 'Key Formulas', 'Common Mistakes', 'Quick Definitions', 'Memory Aids', 'Exam Tips'],
    },
    career: {
        id: 'career',
        label: 'Career Path',
        icon: 'Rocket',
        emoji: '🚀',
        description: 'Map out career trajectories, skills, and opportunities',
        color: 'var(--accent-blue)',
        categories: ['Industry Overview', 'Required Skills', 'Entry Points', 'Growth Ladder', 'Salary & Demand', 'Future Trends'],
    },
    dataIntegration: {
        id: 'data-integration',
        label: 'Data Explorer',
        icon: 'Database',
        emoji: '🗄️',
        beta: true,
        description: 'Map out personal documents, Drive folders, or Database schemas',
        color: 'var(--accent-cyan)',
        categories: ['Core Structure', 'Key Entities', 'Relationships', 'Main Concepts', 'Attributes', 'Summary Insights'],
    },
};

export const MODE_LIST = [
    MODES.research,
    MODES.brainstorm,
    MODES.connect,
    MODES.learning,
    MODES.revision,
    MODES.study,
    MODES.career,
    MODES.dataIntegration,
];

export const DEFAULT_MODE = 'research';

export const getModeIcon = (modeId) => {
    const icons = {
        research:           Search,
        learning:           BookOpen,
        brainstorm:         Lightbulb,
        study:              ClipboardList,
        connect:            Link2,
        revision:           RefreshCcw,
        career:             Rocket,
        'data-integration': Database,
    };
    return icons[modeId] || Search;
};
