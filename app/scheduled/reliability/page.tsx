
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { SchedulerPost } from "@/components/scheduler/types";
import ReliabilityTable from "@/components/scheduler/ReliabilityTable";

export default function ReliabilityPage() {
    const [posts, setPosts] = useState<SchedulerPost[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/schedule");
            const data = await res.json();
            // Sort by date (newest first)
            const sorted = data.map((p: any) => ({
                ...p,
                scheduledAt: p.scheduledAt ? new Date(p.scheduledAt) : undefined
            })).sort((a: any, b: any) => {
                const dateA = a.scheduledAt || new Date(0);
                const dateB = b.scheduledAt || new Date(0);
                return dateB.getTime() - dateA.getTime();
            });
            setPosts(sorted);
        } catch (e) {
            console.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="h-full overflow-y-auto bg-background text-foreground font-sans p-6 scrollbar-hide">
            {/* Header */}
            <div className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-10 mb-6">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/scheduled" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Reliability Dashboard</h1>
                            <p className="text-xs text-muted-foreground">System Logs & Posting Status</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <StatsCard label="Total Scheduled" value={posts.length} color="blue" />
                    <StatsCard label="Posted Successfully" value={posts.filter(p => p.posted).length} color="green" />
                    <StatsCard label="Pending" value={posts.filter(p => !p.posted && !p.isDraft && p.scheduledAt && new Date(p.scheduledAt) > new Date()).length} color="yellow" />
                    <StatsCard label="Failed" value={posts.filter(p => p.error).length} color="red" />
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : (
                        <ReliabilityTable posts={posts} />
                    )}
                </div>
            </div>
        </div>
    );
}

function StatsCard({ label, value, color }: { label: string, value: number, color: "blue" | "green" | "yellow" | "red" }) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        yellow: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        red: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[color]} bg-card`}>
            <p className="text-xs font-medium opacity-80 mb-1 text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}
