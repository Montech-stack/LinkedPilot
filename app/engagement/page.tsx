"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Zap, Shield, UserCheck, Bot } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function EngagementPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Mock Settings State
    const [autoReply, setAutoReply] = useState(false);
    const [autoComment, setAutoComment] = useState(false);
    const [safeMode, setSafeMode] = useState(true);

    const handleSave = async () => {
        const toastId = toast.loading('Saving AI Agent configuration...');
        try {
            const res = await fetch('/api/engagement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoReply, autoComment, safeMode })
            });
            if (res.ok) {
                toast.success('Engagement settings updated!', { id: toastId });
            } else {
                toast.error('Failed to save settings', { id: toastId });
            }
        } catch (e) {
            toast.error('Error saving settings', { id: toastId });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                    <div className="max-w-4xl mx-auto p-6 lg:p-10">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                                <Bot className="w-8 h-8 text-primary" />
                                Engagement Pilot
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Configure your AI agent to automatically interact with your audience and network.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Inbound Engagement */}
                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-blue-500" />
                                        Inbound Engagement (Auto-Reply)
                                    </CardTitle>
                                    <CardDescription>
                                        Automatically reply to comments on your posts to boost algorithm reach.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-base font-semibold">Enable Auto-Reply</Label>
                                            <p className="text-sm text-muted-foreground">AI will generate context-aware replies to comments.</p>
                                        </div>
                                        <Switch checked={autoReply} onCheckedChange={setAutoReply} />
                                    </div>

                                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Reply Style</p>
                                        <div className="flex gap-2">
                                            {['Professional', 'Friendly', 'Grateful', 'Questioning'].map(style => (
                                                <div key={style} className="px-3 py-1 bg-background border border-border rounded-full text-xs cursor-pointer hover:border-primary transition-colors">
                                                    {style}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Outbound Engagement */}
                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        Outbound Engagement (Network Growth)
                                    </CardTitle>
                                    <CardDescription>
                                        Automatically comment on posts from top creators in your niche.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-base font-semibold">Enable Auto-Comment</Label>
                                            <p className="text-sm text-muted-foreground">Interact with key accounts to increase profile visibility.</p>
                                        </div>
                                        <Switch checked={autoComment} onCheckedChange={setAutoComment} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Safety Settings */}
                            <Card className="border-border bg-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-500" />
                                        Safety & Controls
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-base font-semibold">Safe Mode</Label>
                                            <p className="text-sm text-muted-foreground">Prevents controversial topics and aggressive tones.</p>
                                        </div>
                                        <Switch checked={safeMode} onCheckedChange={setSafeMode} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-base font-semibold">Human Review</Label>
                                            <p className="text-sm text-muted-foreground">Draft replies but wait for approval before posting.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end pt-4">
                                <Button size="lg" onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    Save Configuration
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
