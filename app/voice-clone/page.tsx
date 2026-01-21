"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Upload, Globe, Check, Link as LinkIcon, AlertCircle, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import toast from "react-hot-toast";

export default function VoiceClonePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [textSample, setTextSample] = useState("");
    const [isanalyzing, setIsAnalyzing] = useState(false);
    const [voiceProfile, setVoiceProfile] = useState<{ name: string; traits: string[] } | null>(null);

    useEffect(() => {
        // Load existing profile from storage
        const saved = localStorage.getItem("maxis_voice_profile");
        if (saved) {
            try {
                setVoiceProfile(JSON.parse(saved));
            } catch { }
        }
    }, []);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        // Simulate analysis delay
        setTimeout(() => {
            const traits = ["Professional", "Assertive", "Data-Driven", "Concise"];
            const profile = { name: "My Professional Voice", traits };
            setVoiceProfile(profile);
            localStorage.setItem("maxis_voice_profile", JSON.stringify(profile));
            setIsAnalyzing(false);
            toast.success("Voice profile cloned successfully!");
        }, 2000);
    };

    const handleClear = () => {
        setVoiceProfile(null);
        localStorage.removeItem("maxis_voice_profile");
        toast.success("Voice profile removed");
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                    <div className="max-w-4xl mx-auto p-6 lg:p-10">

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Mic className="w-6 h-6" />
                                </div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                                    Voice Cloning Studio
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-lg">
                                Train Maxis to write exactly like you. Upload your best performing posts or link your LinkedIn to clone your unique tone and style.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left: Input */}
                            <Card className="border-border bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Training Source</CardTitle>
                                    <CardDescription>Provide content to analyze your writing style.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="text" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
                                            <TabsTrigger value="text">Paste Text</TabsTrigger>
                                            <TabsTrigger value="link">LinkedIn URL</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="text" className="space-y-4">
                                            <Textarea
                                                placeholder="Paste 3-5 of your best performing posts here..."
                                                className="min-h-[200px] bg-muted/30 border-primary/20 focus:border-primary"
                                                value={textSample}
                                                onChange={e => setTextSample(e.target.value)}
                                            />
                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90 text-white"
                                                onClick={handleAnalyze}
                                                disabled={isanalyzing || textSample.length < 50}
                                            >
                                                {isanalyzing ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <Mic className="w-4 h-4 mr-2" />}
                                                {isanalyzing ? "Analyzing Tone..." : "Clone My Voice"}
                                            </Button>
                                        </TabsContent>
                                        <TabsContent value="link" className="space-y-4">
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="https://linkedin.com/in/username"
                                                    className="bg-muted/30 border-primary/20"
                                                    value={linkedinUrl}
                                                    onChange={e => setLinkedinUrl(e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    We will analyze your last 10 posts.
                                                </p>
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={handleAnalyze}
                                                disabled={isanalyzing || !linkedinUrl.includes("linkedin.com")}
                                            >
                                                {isanalyzing ? "Analyzing..." : "Connect & Clone"}
                                            </Button>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* Right: Result */}
                            <div className="space-y-6">
                                <Card className="h-full border-border bg-gradient-to-br from-card to-primary/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-yellow-400" />
                                            Your Voice Profile
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {voiceProfile ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="space-y-6"
                                            >
                                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-3">
                                                    <Check className="w-5 h-5" />
                                                    <span className="font-semibold">Voice Clone Active</span>
                                                </div>

                                                <div className="space-y-3">
                                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Detected Traits</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {voiceProfile.traits.map(trait => (
                                                            <span key={trait} className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                                                                {trait}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                                    <p className="text-sm italic text-muted-foreground">
                                                        "Maxis will now write content that sounds exactly like you. You can toggle this on/off in the Studio."
                                                    </p>
                                                </div>

                                                <Button variant="destructive" variant="outline" className="w-full hover:bg-red-500/10 text-red-500 border-red-500/20" onClick={handleClear}>
                                                    Delete Profile
                                                </Button>
                                            </motion.div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50">
                                                <Mic className="w-16 h-16 mb-4 text-muted-foreground" />
                                                <p className="text-lg font-medium">No voice profile detected</p>
                                                <p className="text-sm text-muted-foreground">Train your AI to unlock personalized content generation.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
