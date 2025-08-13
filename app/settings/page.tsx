"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Bell, Shield, Palette, Download, Trash2, Eye, EyeOff, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "Software Engineer passionate about AI and content creation",
    company: "Tech Corp",
    position: "Senior Developer",
    location: "San Francisco, CA",
  })

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    postReminders: true,
    weeklyDigest: false,
    marketingEmails: false,
  })

  const [preferences, setPreferences] = useState({
    theme: "dark",
    language: "en",
    timezone: "PST",
    defaultTone: "professional",
  })

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "data", label: "Data", icon: Download },
  ]

  const handleSave = () => {
    console.log("Settings saved")
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="bg-[#0a0b0f] border-[#2d3748] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="bg-[#0a0b0f] border-[#2d3748] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <Input
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  className="bg-[#0a0b0f] border-[#2d3748] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <Input
                  value={profileData.position}
                  onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                  className="bg-[#0a0b0f] border-[#2d3748] text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Bio</label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="bg-[#0a0b0f] border-[#2d3748] text-white"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      className="bg-[#0a0b0f] border-[#2d3748] text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <Input type="password" className="bg-[#0a0b0f] border-[#2d3748] text-white" />
                </div>
              </div>
            </div>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0b0f] rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {key === "emailUpdates" && "Email Updates"}
                    {key === "postReminders" && "Post Reminders"}
                    {key === "weeklyDigest" && "Weekly Digest"}
                    {key === "marketingEmails" && "Marketing Emails"}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {key === "emailUpdates" && "Get notified about important account updates"}
                    {key === "postReminders" && "Reminders to create and schedule posts"}
                    {key === "weeklyDigest" && "Weekly summary of your content performance"}
                    {key === "marketingEmails" && "Product updates and promotional content"}
                  </div>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [key]: !value })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC]" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )

      case "preferences":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <Select
                value={preferences.theme}
                onValueChange={(value) => setPreferences({ ...preferences, theme: value })}
              >
                <SelectTrigger className="bg-[#0a0b0f] border-[#2d3748] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d29] border-[#2d3748]">
                  <SelectItem value="dark" className="text-white hover:bg-[#2d3748]">
                    Dark
                  </SelectItem>
                  <SelectItem value="light" className="text-white hover:bg-[#2d3748]">
                    Light
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default Tone</label>
              <Select
                value={preferences.defaultTone}
                onValueChange={(value) => setPreferences({ ...preferences, defaultTone: value })}
              >
                <SelectTrigger className="bg-[#0a0b0f] border-[#2d3748] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d29] border-[#2d3748]">
                  <SelectItem value="professional" className="text-white hover:bg-[#2d3748]">
                    Professional
                  </SelectItem>
                  <SelectItem value="friendly" className="text-white hover:bg-[#2d3748]">
                    Friendly
                  </SelectItem>
                  <SelectItem value="casual" className="text-white hover:bg-[#2d3748]">
                    Casual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "privacy":
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0b0f] rounded-lg">
              <div className="flex-1">
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-gray-400 text-sm">Add extra security to your account</div>
              </div>
              <Button
                variant="outline"
                className="border-[#2d3748] text-gray-300 hover:bg-[#2d3748] bg-transparent w-full sm:w-auto"
              >
                Enable
              </Button>
            </div>
          </div>
        )

      case "data":
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0b0f] rounded-lg">
              <div className="flex-1">
                <div className="font-medium">Export Data</div>
                <div className="text-gray-400 text-sm">Download all your posts and data</div>
              </div>
              <Button className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-red-400 mb-2">Delete Account</div>
                  <div className="text-gray-300 text-sm mb-4">
                    Permanently delete your account and all data. This cannot be undone.
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white bg-transparent w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 gradient-text">Settings</h1>
            <p className="text-gray-400 text-lg">Manage your account settings and preferences</p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            className="gradient-card rounded-xl border border-[#2d3748] mb-6 shadow-xl glow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-w-0 ${
                    activeTab === tab.id
                      ? "border-[#0077B5] text-[#0077B5] bg-gradient-to-r from-[#0077B5]/10 to-[#00A0DC]/10"
                      : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div
            className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-xl glow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {renderTabContent()}

            {/* Save Button */}
            <div className="flex justify-end mt-8 pt-6 border-t border-[#2d3748]">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg glow-button w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
