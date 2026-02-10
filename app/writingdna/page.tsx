"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dna,
    Upload,
    Check,
    AlertCircle,
    Sparkles,
    Activity,
    Brain,
    Fingerprint,
    BarChart3,
    ArrowRight,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import toast from "react-hot-toast";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    Cell
} from 'recharts';

// --- Types ---
interface VoiceProfile {
    name: string;
    toneData: { subject: string; A: number; fullMark: number }[];
    sentenceRhythm: { name: string; value: number }[];
    vocabularyScore: number; // 0-100
    topKeywords: string[];
    archetype: string;
}

const DEFAULT_TONE_DATA = [
    { subject: 'Professional', A: 0, fullMark: 100 },
    { subject: 'Casual', A: 0, fullMark: 100 },
    { subject: 'Assertive', A: 0, fullMark: 100 },
    { subject: 'Empathetic', A: 0, fullMark: 100 },
    { subject: 'Direct', A: 0, fullMark: 100 },
    { subject: 'Storyteller', A: 0, fullMark: 100 },
];

export default function VoiceClonePage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [textSample, setTextSample] = useState("");
    const [activeTab, setActiveTab] = useState("dna");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState("");
    const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);

    useEffect(() => {
        // Load existing profile
        const saved = localStorage.getItem("maxis_voice_profile_v2");
        if (saved) {
            try {
                setVoiceProfile(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse voice profile", e);
            }
        }
    }, []);

    const simulateAnalysis = async () => {
        setIsAnalyzing(true);
        const steps = [
            "Extracting linguistic patterns...",
            "Measuring sentence cadence variance...",
            "Analyzing vocabulary density...",
            "Mapping tone against 6-point axis...",
            "Finalizing 'Writing DNA' model..."
        ];

        for (const step of steps) {
            setAnalysisStep(step);
            await new Promise(r => setTimeout(r, 800));
        }

        // Mock Result based on input length or random
        const mockProfile: VoiceProfile = {
            name: "My Professional Voice",
            archetype: "The Strategic Visionary",
            toneData: [
                { subject: 'Professional', A: 85, fullMark: 100 },
                { subject: 'Casual', A: 30, fullMark: 100 },
                { subject: 'Assertive', A: 75, fullMark: 100 },
                { subject: 'Empathetic', A: 45, fullMark: 100 },
                { subject: 'Direct', A: 80, fullMark: 100 },
                { subject: 'Storyteller', A: 60, fullMark: 100 },
            ],
            sentenceRhythm: [
                { name: 'Short (Punchy)', value: 40 },
                { name: 'Medium (Flow)', value: 35 },
                { name: 'Long (Deep)', value: 25 },
            ],
            vocabularyScore: 78,
            topKeywords: ["Strategic", "Leverage", "Outcome", "Crucial", "Growth"]
        };

        setVoiceProfile(mockProfile);
        localStorage.setItem("maxis_voice_profile_v2", JSON.stringify(mockProfile));
        localStorage.setItem("maxis_voice_profile", JSON.stringify({ name: mockProfile.name, traits: ["Assertive", "Professional", "Direct"] })); // Backward compat
        setIsAnalyzing(false);
        setAnalysisStep("");
        toast.success("Writing DNA extracted successfully!");
    };

    const handleClear = () => {
        if (confirm("Are you sure? This will delete your trained model.")) {
            setVoiceProfile(null);
            localStorage.removeItem("maxis_voice_profile");
            localStorage.removeItem("maxis_voice_profile_v2");
            toast.success("Voice profile deleted");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                    <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-10">

                        {/* --- Header --- */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shaow-purple-500/20">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">Writing DNA Studio</h1>
                                    <p className="text-muted-foreground">Train Maxis to decode and replicate your unique voice.</p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid lg:grid-cols-12 gap-8">

                            {/* --- Left Column: Training Input --- */}
                            <div className="lg:col-span-5 space-y-6">
                                <Card className="border-border bg-card/60 backdrop-blur-sm h-full shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Upload className="w-5 h-5 text-primary" />
                                            Training Source
                                        </CardTitle>
                                        <CardDescription>
                                            Upload your best content. We recommend 5-10 high-performing posts for accuracy.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="dna" className="w-full" onValueChange={setActiveTab}>
                                            <TabsList className="grid w-full grid-cols-2 mb-8">
                                                <TabsTrigger value="dna" className="flex items-center gap-2">
                                                    <Dna className="w-4 h-4" />
                                                    Writing DNA
                                                </TabsTrigger>
                                                <TabsTrigger value="link">LinkedIn URL</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="dna" className="space-y-6">
                                                <div className="relative">
                                                    <Textarea
                                                        placeholder="Paste 3-5 of your best posts here. The more you provide, the better Maxis learns your nuance..."
                                                        className="min-h-[300px] bg-muted/30 border-primary/10 focus:border-primary/50 resize-none p-4 font-mono text-sm leading-relaxed"
                                                        value={textSample}
                                                        onChange={e => setTextSample(e.target.value)}
                                                    />
                                                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md border border-border">
                                                        {textSample.length} chars
                                                    </div>
                                                </div>
                                                <Button
                                                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                                                    onClick={simulateAnalysis}
                                                    disabled={isAnalyzing || textSample.length < 100}
                                                >
                                                    {isAnalyzing ? (
                                                        <span className="flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4 animate-spin" />
                                                            {analysisStep}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <Brain className="w-4 h-4" />
                                                            Analyze My DNA
                                                        </span>
                                                    )}
                                                </Button>
                                            </TabsContent>

                                            <TabsContent value="link" className="space-y-4">
                                                <div className="space-y-2">
                                                    <Input
                                                        placeholder="https://linkedin.com/in/yourprofile"
                                                        className="h-12 bg-muted/30 border-primary/10"
                                                        value={linkedinUrl}
                                                        onChange={e => setLinkedinUrl(e.target.value)}
                                                    />
                                                    <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-blue-600/80 dark:text-blue-400">
                                                            We'll scrape your last 10 posts to build your model. This takes about 30 seconds.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    className="w-full h-12"
                                                    onClick={simulateAnalysis}
                                                    disabled={isAnalyzing || !linkedinUrl.includes("linkedin.com")}
                                                >
                                                    {isAnalyzing ? "Analyzing Profile..." : "Connect & Clone"}
                                                </Button>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- Right Column: DNA Dashboard --- */}
                            <div className="lg:col-span-7">
                                {voiceProfile ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-6"
                                    >
                                        {/* Top Stats */}
                                        <Card className="bg-gradient-to-br from-violet-500/5 via-blue-500/5 to-transparent border-primary/20">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                            <Dna className="w-5 h-5" />
                                                        </div>
                                                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                                                            Writing DNA
                                                        </h2>
                                                    </div>
                                                    <p className="text-muted-foreground">
                                                        Analyze your content to decode your unique voice signature.
                                                    </p>
                                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full border border-green-500/20 text-sm font-semibold">
                                                        <Check className="w-4 h-4" />
                                                        Active Model
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="p-4 rounded-xl bg-card border border-border/50">
                                                        <div className="text-xs text-muted-foreground mb-1">Vocabulary Score</div>
                                                        <div className="text-2xl font-bold flex items-end gap-1">
                                                            {voiceProfile.vocabularyScore}
                                                            <span className="text-xs font-normal text-muted-foreground mb-1">/100</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-muted mt-2 rounded-full overflow-hidden">
                                                            <div className="h-full bg-violet-500" style={{ width: `${voiceProfile.vocabularyScore}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-card border border-border/50 lg:col-span-3">
                                                        <div className="text-xs text-muted-foreground mb-2">Signature Keywords</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {voiceProfile.topKeywords.map(k => (
                                                                <span key={k} className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-md text-xs font-medium border border-violet-200 dark:border-violet-800">
                                                                    {k}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="grid sm:grid-cols-2 gap-6">
                                            {/* Radar Chart (Tone) */}
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-primary" />
                                                        Tone Fingerprint
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={voiceProfile.toneData}>
                                                            <PolarGrid strokeOpacity={0.2} />
                                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 10 }} />
                                                            <Radar
                                                                name="My Voice"
                                                                dataKey="A"
                                                                stroke="#8b5cf6"
                                                                strokeWidth={2}
                                                                fill="#8b5cf6"
                                                                fillOpacity={0.3}
                                                            />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }}
                                                                itemStyle={{ color: '#fff' }}
                                                            />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            {/* Bar Chart (Rhythm) */}
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <BarChart3 className="w-4 h-4 text-primary" />
                                                        Sentence Rhythm
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={voiceProfile.sentenceRhythm} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                                                            <XAxis type="number" hide />
                                                            <Tooltip
                                                                cursor={{ fill: 'transparent' }}
                                                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }}
                                                                itemStyle={{ color: '#fff' }}
                                                            />
                                                            {/* YAxis hidden, using custom labels/legend if needed, or simple bars */}
                                                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                                                {voiceProfile.sentenceRhythm.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#8b5cf6' : '#ec4899'} />
                                                                ))}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                    <div className="flex justify-between text-xs text-muted-foreground px-2 mt-[-20px] relative z-10">
                                                        <span>Punchy</span>
                                                        <span>Flowing</span>
                                                        <span>Deep</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button variant="outline" className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={handleClear}>
                                                Delete Model
                                            </Button>
                                            <Button className="flex-1 gap-2" onClick={() => window.location.href = '/dashboard'}>
                                                Use This Voice <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>

                                    </motion.div>
                                ) : (
                                    /* Empty State */
                                    <Card className="h-full border-dashed border-2 border-border/60 bg-muted/5 flex flex-col items-center justify-center p-8 text-center">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                            <Mic className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">No Voice Model Detected</h3>
                                        <p className="text-muted-foreground max-w-sm mb-8">
                                            Maxis needs to learn your style. Upload content on the left to generate your unique Writing DNA.
                                        </p>
                                        <div className="flex gap-2 text-xs text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                                            <Zap className="w-3 h-3 text-yellow-500" />
                                            <span>Takes &lt; 30 seconds</span>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
