"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Send,
    X,
    Command,
    CheckCircle2,
    XCircle,
    Loader2,
    Calendar,
    Zap,
    BarChart3,
    PenTool,
    ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCommandBar } from "@/app/hooks/useCommandBar";
import { executeAction, type ParsedAction } from "@/lib/executeAction";

const QUICK_ACTIONS = [
    { label: "Generate a post", icon: PenTool, command: "Write a LinkedIn post about" },
    { label: "Schedule content", icon: Calendar, command: "Schedule a post for tomorrow at 9am about" },
    { label: "New automation", icon: Zap, command: "Create a daily automation about" },
    { label: "View analytics", icon: BarChart3, command: "Show my analytics" },
];

export default function CommandBar() {
    const { data: session } = useSession();
    const router = useRouter();
    const {
        isOpen,
        setIsOpen,
        messages,
        isProcessing,
        sendMessage,
        updateMessageResult,
        clearMessages,
    } = useCommandBar();

    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!session) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input.trim());
        setInput("");
    };

    const handleQuickAction = (command: string) => {
        setInput(command + " ");
        inputRef.current?.focus();
    };

    const handleExecuteAction = async (messageId: string, action: ParsedAction) => {
        const result = await executeAction(action, router);
        updateMessageResult(messageId, result);
        if (action.intent === "navigate") {
            setTimeout(() => setIsOpen(false), 300);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-110 transition-all duration-200 overflow-hidden"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
            >
                <img src="/maxis.png" alt="Maxis AI" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
            </motion.button>

            {/* Command Bar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Command Panel - Full Screen Mode */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-[101] flex flex-col md:inset-10 md:rounded-3xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
                        >
                            <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-violet-500/10 to-blue-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center overflow-hidden shadow-lg border border-white/20">
                                            <img src="/maxis.png" alt="AI" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">
                                                Maxis Nexus
                                            </h2>
                                            <p className="text-xs text-muted-foreground">Full App Automation</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {messages.length > 0 && (
                                            <button
                                                onClick={clearMessages}
                                                className="text-xs font-medium text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/10"
                                            >
                                                Clear Chat
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area - Enhanced Typography & Spacing */}
                                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                    {messages.length === 0 ? (
                                        /* Empty State - Hero Style */
                                        <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                                            <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_50px_-12px_rgba(124,58,237,0.5)]">
                                                <Sparkles className="w-10 h-10 text-violet-400" />
                                            </div>
                                            <h3 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                                How can I help you?
                                            </h3>
                                            <p className="text-lg text-muted-foreground mb-10 max-w-md">
                                                I can control settings, manage billing, analyze your voice, and automate your workflow.
                                            </p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                                {QUICK_ACTIONS.map((qa) => (
                                                    <button
                                                        key={qa.label}
                                                        onClick={() => handleQuickAction(qa.command)}
                                                        className="flex items-center gap-3 px-5 py-4 rounded-xl border border-white/5 bg-white/5 text-left transition-all hover:bg-white/10 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 group"
                                                    >
                                                        <div className="p-2 rounded-lg bg-background/50 text-muted-foreground group-hover:text-primary transition-colors">
                                                            <qa.icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                                {qa.label}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                                "{qa.command}..."
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Chat Messages - Modern Bubble Style */
                                        messages.map((msg) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={msg.id}
                                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                <div className={`max-w-[85%] ${msg.role === "user" ? "bg-gradient-to-br from-violet-600 to-blue-700 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-violet-900/20" : "bg-[#1f2937] border border-white/5 text-gray-200 rounded-2xl rounded-tl-sm"} px-6 py-4`}>
                                                    {msg.isLoading ? (
                                                        <div className="flex items-center gap-3">
                                                            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                                                            <span className="text-sm font-medium">Processing request...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                                            {/* Action Buttons */}
                                                            {msg.role === "assistant" && msg.action && msg.action.intent !== "help" && !msg.actionResult && (
                                                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                                                                    <button
                                                                        onClick={() => handleExecuteAction(msg.id, msg.action)}
                                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors shadow-lg shadow-green-900/20"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        Confirm Action
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateMessageResult(msg.id, { success: false, message: "Cancelled" })}
                                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Success/Error State */}
                                                            {msg.actionResult && (
                                                                <div className={`mt-3 p-3 rounded-lg border flex items-start gap-3 ${msg.actionResult.success
                                                                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                                                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                                                    }`}>
                                                                    {msg.actionResult.success ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                                                                    <span className="text-sm font-medium">{msg.actionResult.message}</span>
                                                                </div>
                                                            )}

                                                            {/* Data Preview (Posts, etc) */}
                                                            {msg.actionResult?.data && Array.isArray(msg.actionResult.data) && (
                                                                <div className="mt-4 space-y-3">
                                                                    {msg.actionResult.data.slice(0, 3).map((post: any, idx: number) => (
                                                                        <div key={idx} className="bg-black/20 rounded-lg p-3 text-sm border border-white/5">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{post.platform}</span>
                                                                            </div>
                                                                            <p className="text-gray-300 line-clamp-2">{post.content}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                {/* Input Area - Floating Bar */}
                                <div className="p-6 pt-2">
                                    <form onSubmit={handleSubmit} className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                                        <div className="relative flex items-center bg-[#1f2937] border border-white/10 rounded-2xl p-2 shadow-xl">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Type a command... (e.g., 'Change my name to John', 'Analyze my voice', 'Upgrade plan')"
                                                disabled={isProcessing}
                                                className="flex-1 bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-gray-500 disabled:opacity-50"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!input.trim() || isProcessing}
                                                className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white disabled:opacity-30 hover:shadow-lg hover:shadow-blue-500/20 transition-all transform active:scale-95"
                                            >
                                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </form>
                                    <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 font-sans">Enter</kbd> to Send</span>
                                        <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 font-sans">Esc</kbd> to Close</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
