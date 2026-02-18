"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Target, Users, Layout, CalendarClock } from "lucide-react";

interface AutoIdeaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: AutoIdeaInput) => Promise<void>;
}

export interface AutoIdeaInput {
    niche: string;
    audience: string;
    platform: string;
    frequency: string;
}

export default function AutoIdeaModal({ isOpen, onClose, onGenerate }: AutoIdeaModalProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AutoIdeaInput>({
        niche: "",
        audience: "",
        platform: "linkedin",
        frequency: "3_times_week"
    });

    const handleSubmit = async () => {
        if (!data.niche || !data.audience) return;
        setLoading(true);
        await onGenerate(data);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        Auto-Idea Generator
                    </DialogTitle>
                    <DialogDescription>
                        Define your strategy, and AI will fill your calendar with content ideas.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Niche */}
                    <div className="grid gap-2">
                        <Label htmlFor="niche" className="flex items-center gap-2 text-muted-foreground">
                            <Target className="w-4 h-4" />
                            Niche / Topic
                        </Label>
                        <Input
                            id="niche"
                            value={data.niche}
                            onChange={(e) => setData({ ...data, niche: e.target.value })}
                            placeholder="e.g. SaaS Marketing, Sustainable Living"
                            className="bg-muted/50 border-input-border focus:ring-primary/20"
                        />
                    </div>

                    {/* Audience */}
                    <div className="grid gap-2">
                        <Label htmlFor="audience" className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            Target Audience
                        </Label>
                        <Input
                            id="audience"
                            value={data.audience}
                            onChange={(e) => setData({ ...data, audience: e.target.value })}
                            placeholder="e.g. Startup Founders, Busy Moms"
                            className="bg-muted/50 border-input-border focus:ring-primary/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Platform */}
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <Layout className="w-4 h-4" />
                                Platform
                            </Label>
                            <Select
                                value={data.platform}
                                onValueChange={(val) => setData({ ...data, platform: val })}
                            >
                                <SelectTrigger className="bg-muted/50 border-input-border">
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="twitter">X (Twitter)</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Frequency */}
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <CalendarClock className="w-4 h-4" />
                                Frequency
                            </Label>
                            <Select
                                value={data.frequency}
                                onValueChange={(val) => setData({ ...data, frequency: val })}
                            >
                                <SelectTrigger className="bg-muted/50 border-input-border">
                                    <SelectValue placeholder="Frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekdays">Weekdays (M-F)</SelectItem>
                                    <SelectItem value="3_times_week">3x / Week</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !data.niche || !data.audience}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Ideas
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
