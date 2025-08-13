"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Repeat, Sparkles, X, Clock, TrendingUp, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (scheduleData: any) => void
}

export default function ScheduleModal({ isOpen, onClose, onSchedule }: ScheduleModalProps) {
  const [scheduleType, setScheduleType] = useState<"once" | "recurring">("once")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [recurringType, setRecurringType] = useState("daily")
  const [recurringTime, setRecurringTime] = useState("")

  const optimalTimes = [
    { time: "9:00 AM", engagement: "High", audience: "Morning commuters" },
    { time: "12:00 PM", engagement: "Very High", audience: "Lunch break browsers" },
    { time: "2:00 PM", engagement: "Very High", audience: "Afternoon peak" },
    { time: "5:00 PM", engagement: "High", audience: "End of workday" },
  ]

  const handleSchedule = () => {
    const scheduleData = {
      type: scheduleType,
      date: scheduleDate,
      time: scheduleType === "once" ? scheduleTime : recurringTime,
      recurring: scheduleType === "recurring" ? recurringType : null,
    }
    onSchedule(scheduleData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="gradient-bg rounded-xl p-4 sm:p-6 w-full max-w-2xl border border-[#2d3748] shadow-2xl max-h-[90vh] overflow-y-auto mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold gradient-text">Schedule Your Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Schedule Type Toggle */}
        <div className="flex gradient-card rounded-lg p-1 mb-4 sm:mb-6 border border-[#2d3748]">
          <button
            onClick={() => setScheduleType("once")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 ${
              scheduleType === "once"
                ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Once</span>
            <span className="sm:hidden">Once</span>
          </button>
          <button
            onClick={() => setScheduleType("recurring")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 ${
              scheduleType === "recurring"
                ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">Auto Schedule</span>
            <span className="sm:hidden">Auto</span>
          </button>
        </div>

        {/* Optimal Times Section */}
        <div className="gradient-card rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[#2d3748]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#0077B5]" />
            <span className="font-medium text-[#0077B5] text-sm sm:text-base">Optimal Posting Times</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {optimalTimes.map((timeSlot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 sm:p-3 bg-[#0a0b0f] rounded-lg border border-[#374151] hover:border-[#0077B5] transition-colors cursor-pointer"
                onClick={() => {
                  if (scheduleType === "once") {
                    setScheduleTime(timeSlot.time)
                  } else {
                    setRecurringTime(timeSlot.time)
                  }
                }}
              >
                <div>
                  <div className="font-medium text-white text-sm sm:text-base">{timeSlot.time}</div>
                  <div className="text-xs text-gray-400">{timeSlot.audience}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    timeSlot.engagement === "Very High"
                      ? "bg-green-400/10 text-green-400 border border-green-400/20"
                      : "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                  }`}
                >
                  {timeSlot.engagement}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form fields with better mobile layout */}
        {scheduleType === "once" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0077B5]" />
                Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full bg-[#0a0b0f] border border-[#2d3748] rounded-lg px-3 py-2 sm:py-3 text-white focus:border-[#0077B5] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0077B5]" />
                Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-[#0a0b0f] border border-[#2d3748] rounded-lg px-3 py-2 sm:py-3 text-white focus:border-[#0077B5] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#0077B5]" />
                Frequency
              </label>
              <Select value={recurringType} onValueChange={setRecurringType}>
                <SelectTrigger className="bg-[#0a0b0f] border-[#2d3748] text-white focus:border-[#0077B5] h-10 sm:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d29] border-[#2d3748]">
                  <SelectItem value="daily" className="text-white hover:bg-[#2d3748]">
                    📅 Daily
                  </SelectItem>
                  <SelectItem value="weekly" className="text-white hover:bg-[#2d3748]">
                    📆 Weekly
                  </SelectItem>
                  <SelectItem value="monthly" className="text-white hover:bg-[#2d3748]">
                    🗓️ Monthly
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0077B5]" />
                Time
              </label>
              <input
                type="time"
                value={recurringTime}
                onChange={(e) => setRecurringTime(e.target.value)}
                className="w-full bg-[#0a0b0f] border border-[#2d3748] rounded-lg px-3 py-2 sm:py-3 text-white focus:border-[#0077B5] focus:outline-none transition-colors text-sm sm:text-base"
              />
            </div>
          </div>
        )}

        {/* Analytics Preview */}
        <div className="gradient-card rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[#2d3748]">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="font-medium text-purple-400 text-sm sm:text-base">Expected Performance</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-400">+45%</div>
              <div className="text-xs text-gray-400">Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-400">+32%</div>
              <div className="text-xs text-gray-400">Reach</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-purple-400">+28%</div>
              <div className="text-xs text-gray-400">Comments</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#2d3748] text-gray-300 hover:bg-[#2d3748] bg-transparent transition-all duration-300 h-11 sm:h-12"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg glow-button transition-all duration-300 h-11 sm:h-12"
            onClick={handleSchedule}
            disabled={scheduleType === "once" ? !scheduleDate || !scheduleTime : !recurringTime}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{scheduleType === "once" ? "Schedule Post" : "Set Auto Schedule"}</span>
            <span className="sm:hidden">{scheduleType === "once" ? "Schedule" : "Set Auto"}</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
