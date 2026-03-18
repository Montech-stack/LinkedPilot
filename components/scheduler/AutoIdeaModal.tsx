"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Target, Users, Layout, CalendarClock, Mic2, AlignLeft, Wand2 } from "lucide-react";

interface SocialAccount {
  _id: string;
  name: string;
  platform: string;
  email: string;
  connected: boolean;
}

interface AutoIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: AutoIdeaInput) => Promise<void>;
  accounts?: SocialAccount[];
}

export interface AutoIdeaInput {
  niche: string;
  audience: string;
  platform: string;
  frequency: string;
  tone: string;
  length: string;
  preset: string;
  accountId: string;
}

const PRESETS = [
  { value: "none", label: "No style (AI decides)" },
  { value: "thought-leadership", label: "Thought Leadership" },
  { value: "quick-tips", label: "Quick Tips" },
  { value: "personal-story", label: "Storytelling" },
  { value: "controversial-take", label: "Controversial Take" },
  { value: "case-study", label: "Case Study" },
  { value: "question-hook", label: "Question Hook" },
  { value: "list-post", label: "List Post" },
  { value: "behind-scenes", label: "Behind the Scenes" },
];

export default function AutoIdeaModal({ isOpen, onClose, onGenerate, accounts = [] }: AutoIdeaModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AutoIdeaInput>({
    niche: "",
    audience: "",
    platform: "LinkedIn",
    frequency: "3_times_week",
    tone: "Professional",
    length: "medium",
    preset: "none",
    accountId: accounts[0]?._id || "",
  });

  // Update accountId default when accounts load
  React.useEffect(() => {
    if (accounts.length > 0 && !data.accountId) {
      setData(d => ({ ...d, accountId: accounts[0]._id }));
    }
  }, [accounts]);

  const handleSubmit = async () => {
    if (!data.niche || !data.audience) return;
    setLoading(true);
    await onGenerate(data);
    setLoading(false);
    onClose();
  };

  const set = (key: keyof AutoIdeaInput) => (val: string) => setData(d => ({ ...d, [key]: val }));

  const linkedinAccounts = accounts.filter(a => a.platform?.toLowerCase().includes("linkedin") && a.connected);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-card/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            AI Post Scheduler
          </DialogTitle>
          <DialogDescription>
            Generate complete, ready-to-publish posts and fill your calendar automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Account selector */}
          {linkedinAccounts.length > 0 && (
            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Post As
              </Label>
              <Select value={data.accountId} onValueChange={set("accountId")}>
                <SelectTrigger className="bg-muted/50 border-input-border">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {linkedinAccounts.map(acc => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.name} ({acc.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Niche */}
          <div className="grid gap-2">
            <Label htmlFor="niche" className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              Topic / Niche
            </Label>
            <Input
              id="niche"
              value={data.niche}
              onChange={e => setData(d => ({ ...d, niche: e.target.value }))}
              placeholder="e.g. SaaS Growth, Personal Finance, Leadership"
              className="bg-muted/50 border-input-border"
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
              onChange={e => setData(d => ({ ...d, audience: e.target.value }))}
              placeholder="e.g. Startup Founders, Marketing Managers"
              className="bg-muted/50 border-input-border"
            />
          </div>

          {/* Row: Platform + Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Layout className="w-4 h-4" />
                Platform
              </Label>
              <Select value={data.platform} onValueChange={set("platform")}>
                <SelectTrigger className="bg-muted/50 border-input-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Twitter">X (Twitter)</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="w-4 h-4" />
                Frequency
              </Label>
              <Select value={data.frequency} onValueChange={set("frequency")}>
                <SelectTrigger className="bg-muted/50 border-input-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (7x/week)</SelectItem>
                  <SelectItem value="weekdays">Weekdays (5x/week)</SelectItem>
                  <SelectItem value="3_times_week">3x per week</SelectItem>
                  <SelectItem value="weekly">Once a week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Tone + Length */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mic2 className="w-4 h-4" />
                Tone
              </Label>
              <Select value={data.tone} onValueChange={set("tone")}>
                <SelectTrigger className="bg-muted/50 border-input-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Conversational">Conversational</SelectItem>
                  <SelectItem value="Inspiring">Inspiring</SelectItem>
                  <SelectItem value="Bold">Bold & Direct</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Humorous">Witty / Humorous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <AlignLeft className="w-4 h-4" />
                Post Length
              </Label>
              <Select value={data.length} onValueChange={set("length")}>
                <SelectTrigger className="bg-muted/50 border-input-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~100 words)</SelectItem>
                  <SelectItem value="medium">Medium (~200 words)</SelectItem>
                  <SelectItem value="long">Long (~350 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Style */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Content Style <span className="text-muted-foreground/50 font-normal">(optional)</span>
            </Label>
            <Select value={data.preset} onValueChange={set("preset")}>
              <SelectTrigger className="bg-muted/50 border-input-border">
                <SelectValue placeholder="Let AI decide" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                Generating posts…
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate &amp; Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
