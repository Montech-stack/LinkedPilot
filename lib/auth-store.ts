"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { signIn, signOut, useSession } from "next-auth/react"
import { useEffect } from "react"
import toast from "react-hot-toast"

export interface User {
  id: string
  email: string
  name: string
  image?: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  hydrated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  googleLogin: () => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setHydrated: (value: boolean) => void
  syncWithSession: (sessionUser: any) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hydrated: false,

      signup: async (email, password, name) => {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })
        if (!res.ok) throw new Error(await res.text())

        // Clear onboarding flag for fresh signup experience
        sessionStorage.removeItem("maxis_onboarding_shown");

        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false
        })

        if (signInResult?.ok) {
          set({
            user: { id: "", email, name },
            isAuthenticated: true
          })
        }
      },

      login: async (email, password) => {
        // Clear onboarding flag for fresh login experience
        sessionStorage.removeItem("maxis_onboarding_shown");

        const res = await signIn("credentials", {
          email,
          password,
          redirect: false
        })

        if (res?.error) {
          throw new Error(res.error)
        }

        if (res?.ok) {
          // Optimistic update; useAuthSync will confirm details shortly
          set({
            user: { id: "", email, name: "" },
            isAuthenticated: true
          })
        }
      },

      googleLogin: async () => {
        console.log("🔵 [AUTH] Starting Google sign in...")
        toast("🔵 [AUTH] Starting Google sign in...")

        // 1. CLEAR localStorage completely to remove cached old user
        try {
          useAuthStore.persist.clearStorage()
          localStorage.removeItem("auth-store")
          console.log("✅ [AUTH] Cleared auth-store from localStorage")
        } catch (error) {
          console.error("❌ [AUTH] Failed to clear localStorage:", error)
        }

        // 2. Clear NextAuth session (without redirecting yet)
        try {
          await signOut({ redirect: false })
          console.log("✅ [AUTH] NextAuth session cleared")
        } catch (error) {
          console.log("ℹ️ [AUTH] No session to clear")
        }

        // 3. Clear Zustand state
        set({
          user: null,
          isAuthenticated: false
        })
        console.log("✅ [AUTH] Zustand state cleared")

        // 4. Now sign in with Google - redirect to dashboard
        console.log("🔵 [AUTH] Starting Google OAuth...")
        sessionStorage.removeItem("maxis_onboarding_shown"); // Clear for fresh login
        await signIn("google", {
          redirect: true,
          callbackUrl: "/dashboard",
        })
      },

      logout: async () => {
        console.log("🚪 [AUTH] Logging out...")

        try {
          useAuthStore.persist.clearStorage()
          localStorage.removeItem("auth-store")
          console.log("✅ [AUTH] Cleared auth-store from localStorage")
        } catch (error) {
          console.error("❌ [AUTH] Failed to clear localStorage:", error)
        }

        set({
          user: null,
          isAuthenticated: false
        })

        console.log("✅ [AUTH] Zustand state cleared")

        try {
          await signOut({ redirect: true, callbackUrl: "/" })
          console.log("✅ [AUTH] NextAuth signed out")
        } catch (error) {
          console.error("❌ [AUTH] Sign out error:", error)
        }
      },

      setUser: (user) => {
        console.log("👤 [AUTH] Setting user:", user)
        set({ user, isAuthenticated: !!user })
      },

      syncWithSession: (sessionUser) => {
        const currentUser = get().user

        // Only update if the user is different to prevent infinite re-renders
        if (sessionUser && (!currentUser || currentUser.email !== sessionUser.email)) {
          console.log("🔄 [AUTH] Syncing with NextAuth session:", sessionUser.email)
          set({
            user: {
              id: sessionUser.id || "",
              email: sessionUser.email || "",
              name: sessionUser.name || "",
              image: sessionUser.image || null,
            },
            isAuthenticated: true,
          })
        } else if (!sessionUser && currentUser) {
          // If NextAuth says we are logged out, but Zustand thinks we are in
          console.log("🔄 [AUTH] Session expired, clearing state")
          set({ user: null, isAuthenticated: false })
        }
      },

      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("❌ [AUTH STORE] Rehydrate error:", error)
        } else if (state) {
          console.log("✅ [AUTH STORE] Rehydrated:", state.user?.email || "No user")
        }

        queueMicrotask(() => {
          useAuthStore.setState({ hydrated: true })
          console.log("🔄 [AUTH STORE] Hydration complete")
        })
      },
    }
  )
)

// This hook must be used in a client component (like Providers.tsx)
// to bridge the gap between NextAuth (server/cookies) and Zustand (client state)
export function useAuthSync() {
  const { data: session, status } = useSession()
  const syncWithSession = useAuthStore((state) => state.syncWithSession)

  useEffect(() => {
    if (status === "loading") return

    if (status === "authenticated" && session?.user) {
      syncWithSession(session.user)
    } else if (status === "unauthenticated") {
      syncWithSession(null)
    }
  }, [session, status, syncWithSession])
}