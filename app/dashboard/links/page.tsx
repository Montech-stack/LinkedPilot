"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Linkedin, Facebook, Instagram, Twitter, Youtube, Globe, Plus, Trash2, Loader2, Link2, Power, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { cn } from "@/lib/utils";

const platforms = [
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-[#0077B5]",
    gradient: "from-[#0077B5]/20 to-[#0077B5]/5",
    border: "group-hover:border-[#0077B5]/50",
    requiresOAuth: true,
    isComingSoon: false,
  },
  {
    name: "Twitter / X",
    icon: Twitter,
    color: "text-foreground",
    gradient: "from-foreground/10 to-transparent",
    border: "group-hover:border-foreground/50",
    requiresOAuth: true,
    isComingSoon: false,
  },
  { name: "Facebook", icon: Facebook, color: "text-[#1877F2]", gradient: "from-[#1877F2]/20 to-transparent", border: "group-hover:border-[#1877F2]/50", isComingSoon: false },
  { name: "Instagram", icon: Instagram, color: "text-[#E4405F]", gradient: "from-[#E4405F]/20 to-transparent", border: "group-hover:border-[#E4405F]/50", isComingSoon: false },
  { name: "YouTube", icon: Youtube, color: "text-[#FF0000]", gradient: "from-[#FF0000]/20 to-transparent", border: "group-hover:border-[#FF0000]/50", isComingSoon: false },
  { name: "Website", icon: Globe, color: "text-emerald-400", gradient: "from-emerald-500/20 to-transparent", border: "group-hover:border-emerald-500/50", isComingSoon: true },
];

export default function LinksPage() {
  const [accounts, setAccounts] = useState<{ [platform: string]: any[] }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState<{ [platform: string]: boolean }>({});
  const [formData, setFormData] = useState<{ [platform: string]: { name: string; email: string } }>({});
  const [loading, setLoading] = useState<{ [platform: string]: boolean }>({});

  useEffect(() => {
    fetch("/api/social")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.reduce((acc: any, item: any) => {
          if (!acc[item.platform]) acc[item.platform] = [];
          acc[item.platform].push(item);
          return acc;
        }, {});
        setAccounts(formatted);
      });
  }, []);

  const handleOAuthConnect = (platform: string) => {
    const form = formData[platform];
    if (!form?.name || !form?.email) return toast.error("Full details required");

    sessionStorage.setItem("pending_social_account", JSON.stringify({
      name: form.name,
      email: form.email,
      platform: platform,
    }));

    const authPath = platform.toLowerCase().replace(/ \/ x/, '');
    window.location.href = `/api/${authPath}/auth`;
  };

  const handleRemoveAccount = async (platform: string, index: number) => {
    const account = accounts[platform][index];
    await fetch(`/api/social/${account._id}`, { method: "DELETE" });
    setAccounts((prev) => ({
      ...prev,
      [platform]: prev[platform].filter((_, i) => i !== index),
    }));
    toast.success("Account unlinked");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-10">

            <div className="mb-10">
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Connected Platforms</h1>
              <p className="text-muted-foreground">Manage your digital presence across the web.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((p, i) => {
                const linked = accounts[p.name] || [];
                const isForm = showForm[p.name];
                const form = formData[p.name] || { name: "", email: "" };

                return (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative rounded-3xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-all duration-300 ${p.isComingSoon ? 'opacity-60 grayscale' : ''}`}
                  >
                    {/* Header Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center border border-border ${p.color}`}>
                          <p.icon className="w-6 h-6" />
                        </div>
                        {linked.length > 0 && <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20 uppercase tracking-wider">Active</span>}
                        {p.isComingSoon && <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-full border border-yellow-500/20 uppercase tracking-wider">Soon</span>}
                      </div>

                      <h3 className="text-lg font-bold text-card-foreground mb-1">{p.name}</h3>
                      <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                        {linked.length === 0 ? "Connect to start posting automatically." : `${linked.length} account${linked.length > 1 ? 's' : ''} connected.`}
                      </p>

                      {linked.length > 0 && (
                        <div className="space-y-3 mb-6">
                          {linked.map((acc, idx) => (
                            <div key={idx} className="bg-background rounded-xl p-3 border border-border flex items-center justify-between group/acc">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                  {acc.name?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{acc.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{acc.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveAccount(p.name, idx)}
                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!p.isComingSoon && (
                        isForm ? (
                          <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                            <input
                              placeholder="Profile Name"
                              value={form.name}
                              onChange={e => setFormData(prev => ({ ...prev, [p.name]: { ...form, name: e.target.value } }))}
                              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:border-primary outline-none text-foreground"
                            />
                            <input
                              placeholder="Email"
                              value={form.email}
                              onChange={e => setFormData(prev => ({ ...prev, [p.name]: { ...form, email: e.target.value } }))}
                              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:border-primary outline-none text-foreground"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleOAuthConnect(p.name)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">Connect</Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowForm(prev => ({ ...prev, [p.name]: false }))}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setShowForm(prev => ({ ...prev, [p.name]: true }))}
                            className="w-full bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-border"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Link New Account
                          </Button>
                        )
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}