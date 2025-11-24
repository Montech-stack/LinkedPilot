// ============================================
// FILE 1: /app/links/page.tsx (UPDATED - Fully Responsive)
// ============================================
"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Linkedin, Facebook, Instagram, Twitter, Youtube, Globe, Plus, Trash2, Loader2, Link2, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import Sidebar from "@/components/Sidebar"
import MobileHeader from "@/components/MobileHeader"

const platforms = [
  { 
    name: "LinkedIn", 
    icon: Linkedin, 
    color: "text-[#0077B5]", 
    bg: "bg-[#0077B5]/10 hover:bg-[#0077B5]/20",
    requiresOAuth: true,
  },
  { name: "Facebook", icon: Facebook, color: "text-[#1877F2]", bg: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20" },
  { name: "Instagram", icon: Instagram, color: "text-[#E4405F]", bg: "bg-[#E4405F]/10 hover:bg-[#E4405F]/20" },
  { name: "Twitter / X", icon: Twitter, color: "text-[#1DA1F2]", bg: "bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20" },
  { name: "YouTube", icon: Youtube, color: "text-[#FF0000]", bg: "bg-[#FF0000]/10 hover:bg-[#FF0000]/20" },
  { name: "Website / Blog", icon: Globe, color: "text-[#00C896]", bg: "bg-[#00C896]/10 hover:bg-[#00C896]/20" },
]

export default function LinksPage() {
  const [accounts, setAccounts] = useState<{ [platform: string]: any[] }>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState<{ [platform: string]: boolean }>({})
  const [formData, setFormData] = useState<{ [platform: string]: { name: string; email: string } }>({})
  const [loading, setLoading] = useState<{ [platform: string]: boolean }>({})

  // Fetch accounts on page load
  useEffect(() => {
    fetch("/api/social")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.reduce((acc: any, item: any) => {
          if (!acc[item.platform]) acc[item.platform] = []
          acc[item.platform].push(item)
          return acc
        }, {})
        setAccounts(formatted)
      })
  }, [])

  // Handle LinkedIn OAuth with form validation
  const handleLinkedInConnect = (platform: string) => {
    const form = formData[platform]
    
    if (!form?.name || !form?.email) {
      toast.error("Please fill in your name and email before connecting")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    sessionStorage.setItem("linkedin_pending_account", JSON.stringify({
      name: form.name,
      email: form.email,
      platform: platform,
    }))

    window.location.href = "/api/linkedin/auth"
  }

  // Add account (non-OAuth platforms)
  const handleAddAccount = async (platform: string) => {
    const form = formData[platform]
    
    if (!form?.name || !form?.email) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading((prev) => ({ ...prev, [platform]: true }))

    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          name: form.name,
          email: form.email,
          connected: false,
        }),
      })

      const record = await res.json()

      setAccounts((prev) => ({
        ...prev,
        [platform]: [...(prev[platform] || []), record],
      }))

      setFormData((prev) => ({ ...prev, [platform]: { name: "", email: "" } }))
      setShowForm((prev) => ({ ...prev, [platform]: false }))
      
      toast.success(`Linked new ${platform} account!`)
    } catch (error) {
      toast.error("Failed to link account")
    } finally {
      setLoading((prev) => ({ ...prev, [platform]: false }))
    }
  }

  // Delete account
  const handleRemoveAccount = async (platform: string, index: number) => {
    const account = accounts[platform][index]
    
    await fetch(`/api/social/${account._id}`, {
      method: "DELETE",
    })

    setAccounts((prev) => ({
      ...prev,
      [platform]: prev[platform].filter((_: any, i: number) => i !== index),
    }))

    toast("Account unlinked", { icon: "🗑️" })
  }

  // Toggle connect/disconnect
  const handleToggleConnection = async (platform: string, index: number) => {
    const account = accounts[platform][index]
    
    const res = await fetch(`/api/social/${account._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connected: !account.connected }),
    })

    const updated = await res.json()

    setAccounts((prev) => {
      const arr = [...prev[platform]]
      arr[index] = updated
      return { ...prev, [platform]: arr }
    })

    toast.success(updated.connected ? "Connected!" : "Disconnected!")
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white flex flex-col lg:flex-row">
      {/* Sidebar: Fixed on desktop, hidden/toggled on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Header: Visible only on small screens */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full ml-0 lg:ml-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
              Link Your Social Accounts
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Manage and link multiple accounts across your social platforms for seamless posting ✨
            </p>
          </motion.div>

          {/* Responsive Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {platforms.map(({ name, icon: Icon, color, bg, requiresOAuth }, i) => {
              const linkedAccounts = accounts[name] || []
              const isFormVisible = showForm[name]
              const platformFormData = formData[name] || { name: "", email: "" }
              const isLoading = loading[name]

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${bg} border border-[#2E3038] rounded-xl p-4 sm:p-6 transition-all hover:border-opacity-50`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 sm:p-3 rounded-lg ${bg} shrink-0`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{name}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{linkedAccounts.length} linked</p>
                      </div>
                    </div>
                  </div>

                  {linkedAccounts.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {linkedAccounts.map((acc, idx) => (
                        <div
                          key={idx}
                          className="bg-[#0F1116] border border-[#2E3038] rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-sm truncate text-gray-200">{acc.name}</p>
                              <p className="text-xs text-gray-500 truncate">{acc.email}</p>
                            </div>
                            <Trash2
                              onClick={() => handleRemoveAccount(name, idx)}
                              className="w-4 h-4 text-gray-500 hover:text-red-400 cursor-pointer transition shrink-0"
                              title="Unlink account"
                            />
                          </div>

                          <Button
                            onClick={() => handleToggleConnection(name, idx)}
                            variant="outline"
                            size="sm"
                            className={`w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-md h-8 transition-colors ${
                              acc.connected
                                ? "bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40 hover:text-red-300"
                                : "bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/40 hover:text-green-300"
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {acc.connected ? "Disconnect" : "Connect"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6 text-gray-500 text-xs sm:text-sm bg-[#0F1116]/50 rounded-lg mb-4 border border-[#2E3038] border-dashed">
                      No accounts linked yet.
                    </div>
                  )}

                  {isFormVisible && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 mb-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={platformFormData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [name]: { ...platformFormData, name: e.target.value },
                            }))
                          }
                          className="w-full bg-[#0F1116] border border-[#2E3038] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 outline-none transition-colors"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={platformFormData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [name]: { ...platformFormData, email: e.target.value },
                            }))
                          }
                          className="w-full bg-[#0F1116] border border-[#2E3038] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => requiresOAuth ? handleLinkedInConnect(name) : handleAddAccount(name)}
                          disabled={isLoading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold h-9"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Wait...
                            </>
                          ) : (
                            <>
                              <Link2 className="w-3 h-3 mr-2" />
                              {requiresOAuth ? "OAuth" : "Save"}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowForm((prev) => ({ ...prev, [name]: false }))
                            setFormData((prev) => ({ ...prev, [name]: { name: "", email: "" } }))
                          }}
                          variant="outline"
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold border-gray-700 h-9"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {!isFormVisible && (
                    <Button
                      onClick={() => setShowForm((prev) => ({ ...prev, [name]: true }))}
                      variant="secondary"
                      className="w-full text-xs sm:text-sm font-semibold py-2 h-9 rounded-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 text-blue-400 border border-blue-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Link Account
                    </Button>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}