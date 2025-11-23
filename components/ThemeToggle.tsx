"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleToggle = () => {
    if (!mounted) return
    setTheme(
      resolvedTheme === "dark"
        ? "light"
        : "dark"
    )
  }

  if (!mounted) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
    >
      {resolvedTheme === "dark" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </Button>
  )
}
