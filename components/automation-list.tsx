"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pause, Play } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { MessageSquare, Clock, BarChart, Share2 } from "lucide-react"

interface Automation {
  id: string
  title: string
  description: string
  type: "response" | "schedule" | "analytics" | "crosspost"
  isActive: boolean
  lastRun: string
  icon: any
}

const initialAutomations: Automation[] = [
  {
    id: "1",
    title: "Auto-Reply to DMs",
    description: "Send a welcome message to new followers who DM you.",
    type: "response",
    isActive: true,
    lastRun: "2 mins ago",
    icon: MessageSquare,
  },
  {
    id: "2",
    title: "Best Time Posting",
    description: "Automatically schedule posts for peak engagement times.",
    type: "schedule",
    isActive: true,
    lastRun: "1 hour ago",
    icon: Clock,
  },
  {
    id: "3",
    title: "Weekly Analytics Report",
    description: "Generate and email a summary of weekly performance.",
    type: "analytics",
    isActive: false,
    lastRun: "3 days ago",
    icon: BarChart,
  },
  {
    id: "4",
    title: "Cross-post to LinkedIn",
    description: "Automatically share Twitter threads to LinkedIn.",
    type: "crosspost",
    isActive: true,
    lastRun: "Yesterday",
    icon: Share2,
  },
]

export function AutomationList() {
  const [automations, setAutomations] = useState(initialAutomations)

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id ? { ...auto, isActive: !auto.isActive } : auto
      )
    )
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {automations.map((automation) => (
        <Card
          key={automation.id}
          className="flex flex-col border border-[#2A2A35] bg-[#14151B] rounded-2xl 
          shadow-[0_0_15px_rgba(0,0,0,0.4)]
          hover:shadow-[0_0_25px_rgba(0,114,255,0.35),0_0_45px_rgba(255,215,0,0.25)]
          transition-all duration-300"
        >
          {/* HEADER */}
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex items-center gap-3">

              {/* ICON WITH BLUE→GOLD GRADIENT */}


              {/* ACTIVE BADGE */}
              <Badge
                className={
                  automation.isActive
                    ? "bg-gradient-to-r from-[#0072FF] to-[#FFD700] text-black font-semibold shadow-md"
                    : "bg-gray-700 text-gray-300"
                }
              >
                {automation.isActive ? "Active" : "Paused"}
              </Badge>
            </div>

            {/* MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-300" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="bg-[#1A1B22] border border-[#2A2A35]"
              >
                <DropdownMenuItem
                  onClick={() => toggleAutomation(automation.id)}
                  className="text-white"
                >
                  {automation.isActive ? (
                    <Pause className="mr-2 h-4 w-4 text-[#FFD700]" />
                  ) : (
                    <Play className="mr-2 h-4 w-4 text-[#0072FF]" />
                  )}
                  {automation.isActive ? "Pause" : "Resume"}
                </DropdownMenuItem>

                <DropdownMenuItem className="text-white">
                  Edit Configuration
                </DropdownMenuItem>

                <DropdownMenuItem className="text-red-400">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          {/* CONTENT */}
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-white">{automation.title}</CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-1">
                {automation.description}
              </CardDescription>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Last run: {automation.lastRun}
              </span>


            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
