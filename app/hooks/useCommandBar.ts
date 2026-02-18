"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    action?: any; // Parsed action from AI
    actionResult?: any; // Result after execution
    isLoading?: boolean;
}

export function useCommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const pathname = usePathname();

    // Keyboard shortcut: Ctrl/Cmd + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isProcessing) return;

            const userMsg: ChatMessage = {
                id: `user-${Date.now()}`,
                role: "user",
                content: text,
                timestamp: new Date(),
            };

            const loadingMsg: ChatMessage = {
                id: `loading-${Date.now()}`,
                role: "assistant",
                content: "",
                timestamp: new Date(),
                isLoading: true,
            };

            setMessages((prev) => [...prev, userMsg, loadingMsg]);
            setIsProcessing(true);

            try {
                const res = await fetch("/api/ai-command", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: text,
                        context: {
                            currentPage: pathname,
                            timezoneOffset: new Date().getTimezoneOffset(),
                        },
                    }),
                });

                const parsed = await res.json();

                if (!res.ok) {
                    throw new Error(parsed.error || "Failed to process command");
                }

                const assistantMsg: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: parsed.confirmation || "Ready to execute.",
                    timestamp: new Date(),
                    action: parsed,
                };

                // Replace loading message with actual response
                setMessages((prev) => [
                    ...prev.filter((m) => !m.isLoading),
                    assistantMsg,
                ]);
            } catch (error) {
                const errMsg: ChatMessage = {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content:
                        error instanceof Error
                            ? error.message
                            : "Something went wrong. Try again.",
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev.filter((m) => !m.isLoading), errMsg]);
            } finally {
                setIsProcessing(false);
            }
        },
        [isProcessing, pathname]
    );

    const updateMessageResult = useCallback(
        (messageId: string, result: any) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId ? { ...m, actionResult: result } : m
                )
            );
        },
        []
    );

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        isOpen,
        setIsOpen,
        messages,
        isProcessing,
        sendMessage,
        updateMessageResult,
        clearMessages,
    };
}
