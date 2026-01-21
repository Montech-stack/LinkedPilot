"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  Info,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Search,
  X,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContentPresetStore, PRESETS } from "@/lib/content-preset-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function PresetsPanel() {
  const {
    selectedPresets,
    togglePreset,
    advancedMode,
    setAdvancedMode,
    customPresets,
    addCustomPreset,
    removeCustomPreset,
    isPresetsExpanded,
    setPresetsExpanded,
    presetOrder,
  } = useContentPresetStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [snippet, setSnippet] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Custom");
  const [search, setSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  // Fetch presets on mount
  useEffect(() => {
    async function fetchPresets() {
      try {
        const res = await fetch("/api/presets");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((p: any) => {
              const exists = customPresets.find(cp => cp.id === p._id || cp.id === p.id);
              if (!exists) {
                // Map _id to id if necessary
                addCustomPreset({ ...p, id: p._id || p.id });
              }
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchPresets();
  }, []);

  const all = [...customPresets, ...PRESETS];

  const filtered = useMemo(() => {
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.promptSnippet.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [search, all]);

  const sorted = filtered.sort((a, b) => {
    const ai = presetOrder.indexOf(a.id);
    const bi = presetOrder.indexOf(b.id);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const create = async () => {
    if (!name.trim() || !snippet.trim()) {
      toast.error("Name & prompt snippet required");
      return;
    }

    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: desc.trim(),
          promptSnippet: snippet.trim(),
          category: category.trim() || "Custom",
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const newPreset = await res.json();
      const presetObj = { ...newPreset, id: newPreset._id };

      addCustomPreset(presetObj);
      toast.success("Style created successfully");

      setName("");
      setSnippet("");
      setDesc("");
      setCategory("Custom");
      setDialogOpen(false);
    } catch (err) {
      toast.error("Failed to create preset");
    }
  };

  const remove = async (id: string) => {
    const isLocal = id.startsWith("custom-");
    try {
      if (!isLocal) {
        await fetch(`/api/presets/${id}`, { method: "DELETE" });
      }
      removeCustomPreset(id);
      toast.success("Removed");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const Card = ({ p }: { p: typeof PRESETS[number] }) => {
    const selected = selectedPresets.includes(p.id);
    const custom = !PRESETS.find(pr => pr.id === p.id);

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => togglePreset(p.id)}
            className={cn(
              "group relative flex flex-col items-start text-left gap-2 p-3.5 rounded-xl border transition-all duration-200 w-full h-full",
              selected
                ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]"
                : "border-border/40 hover:border-border/80 hover:bg-[#1f2128] bg-[#16171d]"
            )}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <span className={cn("font-semibold text-sm leading-tight", selected ? "text-blue-200" : "text-gray-200")}>
                {p.name}
              </span>
              {selected && (
                <div className="bg-blue-500 rounded-full p-0.5 shadow-sm">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {p.description}
            </p>

            <div className="mt-auto pt-2 w-full flex items-center justify-between">
              {p.category && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-[#2A2A35] text-gray-400 hover:bg-[#32323f]">
                  {p.category}
                </Badge>
              )}
            </div>

            {custom && (
              <div
                onClick={e => {
                  e.stopPropagation();
                  remove(p.id);
                }}
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs bg-[#1A1B22] border-[#2A2A35] p-3 shadow-xl">
          <p className="font-semibold mb-1 text-gray-200">{p.name}</p>
          <p className="text-gray-400 mb-2">{p.description}</p>
          <div className="pt-2 border-t border-[#2A2A35]">
            <p className="text-[10px] text-blue-400 mb-1 font-medium">✨ Adds to prompt:</p>
            <code className="text-[10px] text-gray-300 bg-[#2A2A35] px-1.5 py-1 rounded break-words block">
              {p.promptSnippet}
            </code>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  if (fullscreen) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 z-50 bg-[#0F1116] flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-[#2A2A35] bg-[#1A1B22]">
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Editor</span>
            </button>
            <h2 className="font-semibold text-lg text-white">Preset Library</h2>
            <div className="w-20" />
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search all presets..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 bg-[#16171d] border-[#2A2A35]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#16171d] rounded-lg border border-[#2A2A35] p-0.5">
                    <button
                      onClick={() => setAdvancedMode(false)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        !advancedMode ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      Single Select
                    </button>
                    <button
                      onClick={() => setAdvancedMode(true)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        advancedMode ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      Multi Select
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="rounded-xl border border-dashed border-[#2A2A35] hover:border-blue-500/50 hover:bg-blue-500/50 transition-all flex flex-col items-center justify-center py-8 gap-3 group h-full min-h-[160px]">
                      <div className="h-12 w-12 rounded-full bg-[#2A2A35] flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                        <Plus className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-400 group-hover:text-blue-300">Create New Style</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-[#1A1B22] border-[#2A2A35] text-white">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">New Content Style</DialogTitle>
                      <p className="text-sm text-gray-400">Define a reusable style or instruction for your AI posts.</p>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Style Name</Label>
                        <Input
                          placeholder="e.g. 'Thought Leadership'"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="bg-[#14151B] border-[#2A2A35]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Prompt Instructions</Label>
                        <Textarea
                          placeholder="How should the AI write?"
                          value={snippet}
                          onChange={e => setSnippet(e.target.value)}
                          className="min-h-[100px] text-sm bg-[#14151B] border-[#2A2A35]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</Label>
                          <Input placeholder="Optional" value={desc} onChange={e => setDesc(e.target.value)} className="bg-[#14151B] border-[#2A2A35]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</Label>
                          <Input placeholder="Custom" value={category} onChange={e => setCategory(e.target.value)} className="bg-[#14151B] border-[#2A2A35]" />
                        </div>
                      </div>
                      <Button onClick={create} className="w-full mt-2 bg-blue-600 hover:bg-blue-700">Save Style</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {sorted.map(p => (
                  <div key={p.id} className="min-h-[160px]">
                    <Card p={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-200">Content Presets</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={() => setPresetsExpanded(!isPresetsExpanded)}
          >
            {isPresetsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={() => setFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {selectedPresets.length > 0 && (
            <Badge className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
              {selectedPresets.length} selected
            </Badge>
          )}
          <div className="flex items-center bg-[#1A1B22] rounded-lg border border-[#2A2A35] p-0.5">
            <button
              onClick={() => setAdvancedMode(false)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all",
                !advancedMode ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              )}
            >
              Single
            </button>
            <button
              onClick={() => setAdvancedMode(true)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-md transition-all",
                advancedMode ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
              )}
            >
              Multi
            </button>
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
        <Input
          placeholder="Search styles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-[#16171d] border-[#2A2A35] focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-lg"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
            <X className="h-3 w-3 text-gray-500 hover:text-gray-300" />
          </button>
        )}
      </div>

      <TooltipProvider>
        {!isPresetsExpanded ? (
          <div className="relative">
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#1A1B22] to-transparent z-10 pointer-events-none" />
            <div className={cn(
              "flex gap-3 overflow-x-auto pb-4 pt-1 -mx-1 px-1 snap-x",
              "scrollbar-thin scrollbar-thumb-[#2A2A35] hover:scrollbar-thumb-[#3F3F4E] scrollbar-track-transparent"
            )}>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex-shrink-0 w-[160px] rounded-xl border border-dashed border-[#2A2A35] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center py-5 gap-2 group">
                    <div className="h-8 w-8 rounded-full bg-[#2A2A35] flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 group-hover:text-blue-300">Create Style</span>
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md bg-[#1A1B22] border-[#2A2A35] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">New Content Style</DialogTitle>
                    <p className="text-sm text-gray-400">Define a reusable style or instruction for your AI posts.</p>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Style Name</Label>
                      <Input
                        placeholder="e.g. 'Thought Leadership'"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="bg-[#14151B] border-[#2A2A35]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Instructions</Label>
                      <Textarea
                        placeholder="How should the AI write?"
                        value={snippet}
                        onChange={e => setSnippet(e.target.value)}
                        className="min-h-[100px] text-sm bg-[#14151B] border-[#2A2A35]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</Label>
                        <Input placeholder="Optional" value={desc} onChange={e => setDesc(e.target.value)} className="bg-[#14151B] border-[#2A2A35]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</Label>
                        <Input placeholder="Custom" value={category} onChange={e => setCategory(e.target.value)} className="bg-[#14151B] border-[#2A2A35]" />
                      </div>
                    </div>
                    <Button onClick={create} className="w-full mt-2 bg-blue-600 hover:bg-blue-700">Save Style</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {sorted.map(p => (
                <div key={p.id} className="flex-shrink-0 w-[200px] h-[140px]">
                  <Card p={p} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="rounded-xl border border-dashed border-[#2A2A35] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center py-8 gap-3 group h-full min-h-[140px]">
                  <div className="h-10 w-10 rounded-full bg-[#2A2A35] flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-blue-300">Create New Style</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-[#1A1B22] border-[#2A2A35] text-white">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">New Content Style</DialogTitle>
                  <p className="text-sm text-gray-400">Define a reusable style or instruction for your AI posts.</p>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Style Name</Label>
                    <Input
                      placeholder="e.g. 'Thought Leadership'"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="bg-[#14151B] border-[#2A2A35]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Instructions</Label>
                    <Textarea
                      placeholder="How should the AI write?"
                      value={snippet}
                      onChange={e => setSnippet(e.target.value)}
                      className="min-h-[100px] text-sm bg-[#14151B] border-[#2A2A35]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</Label>
                      <Input
                        placeholder="Short description"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        className="bg-[#14151B] border-[#2A2A35]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</Label>
                      <Input
                        placeholder="e.g. Custom"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="bg-[#14151B] border-[#2A2A35]"
                      />
                    </div>
                  </div>
                  <Button onClick={create} className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
                    Save Style
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {sorted.map(p => <div key={p.id} className="min-h-[140px]"><Card p={p} /></div>)}
          </div>
        )}

        {filtered.length === 0 && search && (
          <div className="text-center py-8 text-sm text-muted-foreground bg-[#1A1B22] rounded-xl border border-dashed border-[#2A2A35]">
            No matching styles for "{search}"
            <Button variant="link" size="sm" onClick={() => setSearch("")} className="ml-2 text-blue-400">
              Clear
            </Button>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}
