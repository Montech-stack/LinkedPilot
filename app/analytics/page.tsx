"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, ArrowUp, ArrowDown, Share2, Eye, Heart, MessageCircle, Users, Zap, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from "react-hot-toast";

export default function AnalyticsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/analytics");
            const json = await res.json();
            if (json.success) {
                setData(json.analytics);
                if (json.analytics.length > 0) {
                    setSelectedAccount(json.analytics[0].id);
                }
            }
        } catch (e) {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const currentAccount = data.find(d => d.id === selectedAccount) || data[0];
    const stats = currentAccount?.stats || {};
    const graphData = stats.graphData || [];

    // Aggregated Stats for "Total" view could be added, but per-account is cleaner
    const cards = [
        { label: "Followers", val: stats.followers?.toLocaleString() || "0", icon: Users, color: "text-blue-500", trend: "+2.4%" },
        { label: "Impressions", val: stats.views?.toLocaleString() || "0", icon: Eye, color: "text-purple-500", trend: "+12.1%" },
        { label: "Engagement", val: stats.engagement?.toLocaleString() || "0", icon: Zap, color: "text-yellow-500", trend: "+5.3%" },
        { label: "Avg. Likes", val: Math.floor((stats.views || 0) * 0.05).toLocaleString(), icon: Heart, color: "text-rose-500", trend: "+8.2%" }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                    <div className="max-w-[1400px] mx-auto p-4 md:p-8">

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Analytics Hub</h1>
                                <p className="text-muted-foreground mt-1">Real-time performance metrics for your connected accounts.</p>
                            </div>

                            <div className="flex items-center gap-3 bg-card p-1 rounded-xl border border-border shadow-sm">
                                {loading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
                                {data.length === 0 && !loading ? (
                                    <span className="text-sm px-3 py-1 text-muted-foreground">No accounts connected</span>
                                ) : (
                                    data.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => setSelectedAccount(acc.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAccount === acc.id
                                                ? "bg-primary text-primary-foreground shadow-md"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            {acc.platform}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-96 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-muted-foreground animate-pulse">Crunching numbers...</p>
                                </div>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="bg-muted/30 border border-dashed border-border rounded-3xl p-12 text-center">
                                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-foreground">No Data Available</h3>
                                <p className="text-muted-foreground mb-6">Connect your social accounts to see analytics.</p>
                                <Button onClick={() => window.location.href = '/dashboard/links'}>Connect Accounts</Button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {cards.map((card, i) => (
                                        <Card key={i} className="border-border/50 bg-card/50 hover:bg-card transition-colors shadow-sm hover:shadow-md hover:border-primary/20">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-2.5 rounded-xl bg-muted/50 ${card.color} bg-opacity-10 backdrop-blur-sm`}>
                                                        <card.icon className={`w-5 h-5 ${card.color}`} />
                                                    </div>
                                                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full flex items-center">
                                                        <ArrowUp className="w-3 h-3 mr-1" />
                                                        {card.trend}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{card.val}</h3>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Main Chart */}
                                    <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm">
                                        <CardHeader>
                                            <CardTitle>Growth Overview</CardTitle>
                                            <CardDescription>Views & Engagement over the last 7 days</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={graphData}>
                                                    <defs>
                                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} vertical={false} />
                                                    <XAxis
                                                        dataKey="day"
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(value) => `${value}`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="views"
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorViews)"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="likes"
                                                        stroke="#ec4899"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorLikes)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    {/* Quick Details */}
                                    <div className="space-y-6">
                                        <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
                                            <CardHeader>
                                                <CardTitle className="text-base">Audience Quality</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-muted-foreground">Senior Roles</span>
                                                            <span className="font-bold">64%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 w-[64%]" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-muted-foreground">Founders</span>
                                                            <span className="font-bold">22%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-purple-500 w-[22%]" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-muted-foreground">Recruiters</span>
                                                            <span className="font-bold">14%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-green-500 w-[14%]" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-border/50 bg-card">
                                            <CardHeader>
                                                <CardTitle className="text-base">Top Performing</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground">#{i}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">How to scale SaaS in 2026...</p>
                                                                <p className="text-xs text-muted-foreground">2.4k views • 142 likes</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
