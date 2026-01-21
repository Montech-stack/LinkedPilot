"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Calendar, Repeat, Sparkles, X, Clock, TrendingUp, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"
import { format, parse, isValid, isFuture, addHours } from "date-fns"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (scheduleData: {
    postId: string
    content: string
    scheduleTime: string
    recurring?: "daily" | "weekly" | "monthly" | null
  }) => void
  post: { id: string; content: string }
}

export default function ScheduleModal({ isOpen, onClose, onSchedule, post }: ScheduleModalProps) {
  const [scheduleType, setScheduleType] = useState<"once" | "recurring">("once")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [recurringType, setRecurringType] = useState<"daily" | "weekly" | "monthly">("daily")
  const [recurringTime, setRecurringTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const optimalTimes = [
    { time: "09:00", engagement: "High", audience: "Commute" },
    { time: "12:00", engagement: "Very High", audience: "Lunch" },
    { time: "14:00", engagement: "Very High", audience: "Work Flow" },
    { time: "17:00", engagement: "High", audience: "Evening" },
  ]

  const validateAndFormatSchedule = useMemo(() => {
    if (scheduleType === "once") {
      if (!scheduleDate || !scheduleTime) return null
      const dateTime = parse(`${scheduleDate} ${scheduleTime}`, "yyyy-MM-dd HH:mm", new Date())
      if (!isValid(dateTime)) return null
      // Simple offset handling; assuming input is local
      return dateTime.toISOString()
    } else {
      if (!recurringTime) return null
      const dateTime = parse(`${format(new Date(), "yyyy-MM-dd")} ${recurringTime}`, "yyyy-MM-dd HH:mm", new Date())
      if (!isValid(dateTime)) return null
      return dateTime.toISOString()
    }
  }, [scheduleType, scheduleDate, scheduleTime, recurringTime])

  const handleSchedule = async () => {
    if (!validateAndFormatSchedule) {
      toast.error("Please select a valid future date and time")
      return
    }
    setIsSubmitting(true)
    try {
      await onSchedule({
        postId: post.id,
        content: post.content,
        scheduleTime: validateAndFormatSchedule,
        recurring: scheduleType === "recurring" ? recurringType : null,
      })
      toast.success(scheduleType === "once" ? "Scheduled!" : "Auto-schedule set!")
      onClose()
    } catch {
      toast.error("Failed to schedule")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#14151a] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#17181f]">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Schedule Post
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Toggle */}
          <div className="flex bg-[#0b0c10] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setScheduleType("once")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${scheduleType === "once" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                }`}
            >
              <Calendar className="w-4 h-4" /> One-time
            </button>
            <button
              onClick={() => setScheduleType("recurring")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${scheduleType === "recurring" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                }`}
            >
              <Repeat className="w-4 h-4" /> Recurring
            </button>
          </div>

          {/* Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-blue-400">
              <TrendingUp className="w-4 h-4" /> Recommended Slots (Based on audience)
            </div>
            <div className="grid grid-cols-2 gap-3">
              {optimalTimes.map((slot, i) => (
                <div
                  key={i}
                  onClick={() => scheduleType === 'once' ? setScheduleTime(slot.time) : setRecurringTime(slot.time)}
                  className="cursor-pointer bg-[#0b0c10] hover:bg-[#1A1B22] border border-white/5 hover:border-blue-500/50 rounded-xl p-3 flex flex-col transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-bold">{slot.time}</span>
                    <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">{slot.engagement}</span>
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-gray-400">{slot.audience}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Input Fields */}
          {scheduleType === "once" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Date</label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="bg-[#0b0c10] border-white/10 text-white h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Time</label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="bg-[#0b0c10] border-white/10 text-white h-11"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Frequency</label>
                <Select value={recurringType} onValueChange={(v: any) => setRecurringType(v)}>
                  <SelectTrigger className="bg-[#0b0c10] border-white/10 text-white h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1A1B22] border-white/10 text-white">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Time</label>
                <Input
                  type="time"
                  value={recurringTime}
                  onChange={e => setRecurringTime(e.target.value)}
                  className="bg-[#0b0c10] border-white/10 text-white h-11"
                />
              </div>
            </div>
          )}

          {/* Prediction */}
          <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-xl p-4 border border-blue-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Sparkles className="w-5 h-5" /></div>
              <div>
                <div className="text-sm font-bold text-white">AI Prediction</div>
                <div className="text-xs text-gray-400">Estimated Reach</div>
              </div>
            </div>
            <div className="text-xl font-bold text-white">+24% <span className="text-xs font-normal text-gray-500">vs avg</span></div>
          </div>
        </div>

        <div className="p-6 pt-2 border-t border-white/5 bg-[#17181f] flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-400 hover:text-white">Cancel</Button>
          <Button
            onClick={handleSchedule}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
          >
            {isSubmitting ? "Scheduling..." : "Confirm Schedule"}
          </Button>
        </div>

      </motion.div>
    </motion.div>
  )
}