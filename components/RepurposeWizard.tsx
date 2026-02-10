"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Sparkles,
    ArrowRight,
    Check,
    Linkedin,
    Twitter,
    Instagram,
    Mail,
    Loader2,
    Calendar,
    Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GeneratedPost } from "@/types";
import { usePostGeneration } from "@/hooks/usePostGeneration";
import toast from "react-hot-toast";

interface RepurposeWizardProps {
    onPostsGenerated: (posts: GeneratedPost[]) => void;
}

const CAMPAIGN_FORMATS = [
    {
        id: "li_story",
        platform: "LinkedIn",
        name: "Personal Story",
        icon: Linkedin,
        description: "Vulnerable, narrative-driven post that builds connection.",
        color: "bg-[#0A66C2]",
        promptSuffix: "Format: Personal Storytelling. Open with a vulnerable hook, tell a struggle-to-success story, and end with a lesson."
    },
    {
        id: "li_contrarian",
        platform: "LinkedIn",
        name: "Contrarian Take",
        icon: Linkedin,
        description: "Challenge common industry beliefs to spark debate.",
        color: "bg-[#0A66C2]",
        promptSuffix: "Format: Contrarian/Polite Debate. Challenge a common industry myth. Use 'Most people think X, but actually Y' structure."
    },
    {
        id: "li_value",
        platform: "LinkedIn",
        name: "Actionable Value",
        icon: Linkedin,
        description: "Pure educational value/listicle for saves.",
        color: "bg-[#0A66C2]",
        promptSuffix: "Format: Educational Listicle. Give 3-5 concrete steps or tips. High signal, low noise."
    },
    {
        id: "tw_thread",
        platform: "Twitter",
        name: "Deep Dive Thread",
        icon: Twitter,
        description: "Multi-tweet breakdown of the concept.",
        color: "bg-black dark:bg-white dark:text-black",
        promptSuffix: "Format: Thread. Break this down into 5-7 connected tweets. First tweet must be a viral hook."
    },
    {
        id: "tw_hype",
        platform: "Twitter",
        name: "Hype/Short Tweet",
        icon: Twitter,
        description: "Punchy, one-liner statement.",
        color: "bg-black dark:bg-white dark:text-black",
        promptSuffix: "Format: Single Punchy Tweet. Under 280 chars. High impact, memorable statement."
    },
    {
        id: "ig_caption",
        platform: "Instagram",
        name: "Visual Caption",
        icon: Instagram,
        description: "Engaging caption for a photo/reel.",
        color: "bg-pink-600",
        promptSuffix: "Format: Instagram Caption. Engaging, emoji-friendly, includes hook and 'Link in bio' CTA."
    },
    {
        id: "email_segment",
        platform: "Newsletter", // Mapped to LinkedIn logic usually, or generic
        name: "Newsletter Segment",
        icon: Mail,
        description: "Short paragraph for your weekly email.",
        color: "bg-amber-600",
        promptSuffix: "Format: Newsletter Segment. Intimate, direct-to-inbox tone. 'Hey [Name]' style."
    }
];

export default function RepurposeWizard({ onPostsGenerated }: RepurposeWizardProps) {
    const [topic, setTopic] = useState("");
    const [selectedFormats, setSelectedFormats] = useState<string[]>(CAMPAIGN_FORMATS.map(f => f.id));
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const { generatePosts } = usePostGeneration();

    const toggleFormat = (id: string) => {
        setSelectedFormats(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleRunCampaign = async () => {
        if (!topic.trim()) return toast.error("Please enter a topic first");
        if (selectedFormats.length === 0) return toast.error("Select at least one format");

        setIsProcessing(true);
        setProgress(0);
        const total = selectedFormats.length;
        let completed = 0;
        const allGenerated: GeneratedPost[] = [];

        try {
            // We run these in parallel-ish batches or sequential to avoid rate limits? 
            // Sequential is safer for reliability and progress feedback.
            for (const formatId of selectedFormats) {
                const format = CAMPAIGN_FORMATS.find(f => f.id === formatId)!;

                // Construct prompts
                // We use the existing generatePosts hook which calls /api/generate
                // We pass the format instruction IN the idea
                const enhancedIdea = `${topic}\n\nSTRICT INSTRUCTION: ${format.promptSuffix}`;

                // Map platform names for the API
                const apiPlatform = format.platform === "Newsletter" ? "LinkedIn" : format.platform;

                const posts = await generatePosts(enhancedIdea, [apiPlatform], 1, "medium");

                if (posts && posts.length > 0) {
                    // Tag the post with the specific format type for UI
                    const taggedPost = {
                        ...posts[0],
                        platform: format.platform === "Newsletter" ? "Email" : posts[0].platform, // Visual override
                        note: format.name // Use note for format name
                    };
                    allGenerated.push(taggedPost);
                }

                completed++;
                setProgress(Math.round((completed / total) * 100));
            }

            toast.success("Campaign generated successfully!");
            onPostsGenerated(allGenerated);

        } catch (error) {
            console.error(error);
            toast.error("Some posts failed to generate");
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                    Repurpose Engine
                </h2>
                <p className="text-muted-foreground">Turn 1 Idea into a full week of content.</p>
            </div>

            {/* Input Section */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-semibold text-foreground">
                            What's your big idea?
                        </label>
                        <Textarea
                            placeholder="e.g. Why 'Hustle Culture' is destroying productivity..."
                            className="min-h-[120px] text-lg bg-background/50 border-primary/10 focus:border-primary/40 resize-none p-4"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span> We'll transform this into {selectedFormats.length} unique pieces of content.</span>
                            <span className={topic.length > 10 ? "text-green-500" : "text-gray-400"}>
                                {topic.length} chars
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Format Selection */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Campaign Formats
                    </label>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFormats(CAMPAIGN_FORMATS.map(f => f.id))} className="text-xs h-7">Select All</Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFormats([])} className="text-xs h-7">Clear</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CAMPAIGN_FORMATS.map((format) => {
                        const isSelected = selectedFormats.includes(format.id);
                        return (
                            <motion.div
                                key={format.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleFormat(format.id)}
                                className={`
                  cursor-pointer relative p-4 rounded-xl border transition-all duration-200
                  ${isSelected
                                        ? "bg-primary/5 border-primary/40 shadow-sm"
                                        : "bg-card border-border hover:border-border/80 opacity-70 hover:opacity-100"
                                    }
                `}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${format.color} text-white`}>
                                        <format.icon className="w-4 h-4" />
                                    </div>
                                    {isSelected && (
                                        <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold text-sm mb-1">{format.name}</h3>
                                <p className="text-xs text-muted-foreground leading-snug">
                                    {format.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
                {!isProcessing ? (
                    <Button
                        size="lg"
                        className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:opacity-90 shadow-xl shadow-blue-500/20 transition-all border-0"
                        onClick={handleRunCampaign}
                        disabled={!topic.trim() || selectedFormats.length === 0}
                    >
                        <Sparkles className="w-5 h-5 mr-2 fill-white" />
                        Generate Campaign ({selectedFormats.length} Posts)
                    </Button>
                ) : (
                    <div className="w-full h-16 rounded-2xl bg-muted/30 border border-primary/20 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-primary/10 transition-all duration-300" style={{ width: `${progress}%` }} />
                        <div className="relative z-10 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="font-semibold text-foreground">
                                Generating Asset {Math.floor((progress / 100) * selectedFormats.length) + 1} of {selectedFormats.length}...
                            </span>
                        </div>
                        <div className="relative z-10 text-xs text-muted-foreground mt-1">
                            {progress}% Complete
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
