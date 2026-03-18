"use client";

import React from "react";
import { Wand2 } from "lucide-react";

interface AutoIdeaButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export default function AutoIdeaButton({ onClick, disabled }: AutoIdeaButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
        bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20
        hover:shadow-indigo-500/40 hover:scale-105 transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            <Wand2 size={14} />
            Generate Posts
        </button>
    );
}
