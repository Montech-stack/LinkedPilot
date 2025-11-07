"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Plus,
  Trash2,
  Loader2,
  Link2,
  Power,
} from "lucide-react"
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
    connectUrl: "/api/linkedin/auth",
  },
  {
    name: "Facebook",
    icon: Facebook,
    color: "text-[#1877F2]",
    bg: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20",
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "text-[#E4405F]",
    bg: "bg-[#E4405F]/10 hover:bg-[#E4405F]/20",
  },
  {
    name: "Twitter / X",
    icon: Twitter,
    color: "text-[#1DA1F2]",
    bg: "bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20",
  },
  {
    name: "YouTube",
    icon: Youtube,
    color: "text-[#FF0000]",
    bg: "bg-[#FF0000]/10 hover:bg-[#FF0000]/20",
  },
  {
    name: "Website / Blog",
    icon: Globe,
    color: "text-[#00C896]",
    bg: "bg-[#00C896]/10 hover:bg-[#00C896]/20",
  },
]

export default function LinksPage() {
  const [accounts, setAccounts] = useState<{ [platform: string]: any[] }>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState<{ [platform: string]: boolean }>({})
  const [formData, setFormData] = useState({ name: "", email: "" })
  const [loading, setLoading] = useState(false)

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

  // Add account + save to DB
  const handleAddAccount = async (platform: string, connectUrl?: string) => {
    if (platform === "LinkedIn") {
      window.location.href = connectUrl || "/api/linkedin/login"
      return
    }

    if (!formData.name || !formData.email) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)

    const res = await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        name: formData.name,
        email: formData.email,
        connected: false,
      }),
    })

    const record = await res.json()

    setAccounts((prev) => ({
      ...prev,
      [platform]: [...(prev[platform] || []), record],
    }))

    setFormData({ name: "", email: "" })
    setShowForm((prev) => ({ ...prev, [platform]: false }))
    setLoading(false)
    toast.success(`Linked new ${platform} account!`)
  }

  // Delete account (DB + UI)
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
    <div className="min-h-screen bg-[#0F1116] text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto w-full px-6 py-12"
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Link Your Social Accounts
          </h1>
          <p className="text-gray-400 mb-8">
            Manage and link multiple accounts across your social platforms for seamless posting ✨
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map(({ name, icon: Icon, color, bg, connectUrl }, i) => {
              const linkedAccounts = accounts[name] || []
              const isFormVisible = showForm[name]

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative bg-[#1E1F25] border border-[#2E3038] rounded-2xl p-6 shadow-md transition-all duration-300 hover:shadow-blue-900/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-3 ${color}`}>
                      <div className={`p-3 rounded-xl ${bg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-base">{name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{linkedAccounts.length} linked</span>
                  </div>

                  {linkedAccounts.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {linkedAccounts.map((acc, idx) => (
                        <div
                          key={acc._id || idx}
                          className="flex flex-col bg-[#15161C] border border-[#2E3038] rounded-lg p-3 text-sm text-gray-300"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{acc.name}</span>
                            <button
                              onClick={() => handleRemoveAccount(name, idx)}
                              className="text-red-400 hover:text-red-500 transition"
                              title="Unlink account"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-400">{acc.email}</p>

                          <Button
                            onClick={() => handleToggleConnection(name, idx)}
                            variant="outline"
                            className={`mt-3 flex items-center justify-center gap-2 text-xs font-semibold rounded-md py-1 ${
                              acc.connected
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                          >
                            <Power size={14} />
                            {acc.connected ? "Disconnect" : "Connect"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No accounts linked yet.</p>
                  )}

                  {isFormVisible && (
                    <div className="bg-[#15161C] border border-[#2E3038] rounded-lg p-4 mb-3 space-y-3 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="Account Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full bg-[#0F1116] border border-[#2E3038] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 outline-none"
                      />
                      <input
                        type="email"
                        placeholder="Email or Username"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full bg-[#0F1116] border border-[#2E3038] rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 outline-none"
                      />

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAddAccount(name, connectUrl)}
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-md"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4 mr-1" />
                              Linking...
                            </>
                          ) : (
                            <>
                              <Link2 size={14} /> Link
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() =>
                            setShowForm((prev) => ({ ...prev, [name]: false }))
                          }
                          variant="outline"
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold py-2 rounded-md"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isFormVisible && (
                    <Button
                      onClick={() => setShowForm((prev) => ({ ...prev, [name]: true }))}
                      className="w-full text-sm font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90"
                    >
                      <Plus size={16} /> Link New Account
                    </Button>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
