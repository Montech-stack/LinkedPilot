"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBillingStore } from "@/lib/billing-store";
import toast from "react-hot-toast";

export function BillingInitializer() {
    const { data: session } = useSession();
    const { syncFromDB, hydrated } = useBillingStore();

    useEffect(() => {
        if (!session?.user?.email) return;
        if (hydrated) return; // Prevent re-fetching if already synced

        async function init() {
            try {
                console.log("🔄 [BillingInitializer] Fetching billing info...");
                const res = await fetch("/api/user/me", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    console.log("✅ [BillingInitializer] Received data:", data);
                    syncFromDB({
                        plan: data.plan,
                        tokens: data.tokens,
                    });
                    // Visual confirmation for debugging (can be removed later)
                    if (data.plan === 'enterprise') {
                        toast.success("Enterprise Plan Logic Loaded", { id: 'billing-sync' });
                    }
                } else {
                    console.error("❌ [BillingInitializer] API error:", res.status);
                }
            } catch (error) {
                console.error("❌ [BillingInitializer] Network error:", error);
            }
        }

        init();
    }, [session, syncFromDB, hydrated]);

    return null; // Logic only, no UI
}
