# Maxis — What Changed & Deployment Checklist

## Files Replaced (drop these directly into your project)

| File | What changed |
|------|-------------|
| `lib/billing-store.ts` | Unified plan IDs (TRIAL/STRATEGY/ENTERPRISE/AGENCY), trial logic, removed "free" plan entirely |
| `app/api/subscribe/route.ts` | Live FX rate from API, unified plan IDs, proper Paystack flow, agency contact-sales bypass |
| `app/api/paystack/webhook/route.ts` | NEW — critical missing file. Verifies Paystack signature, upgrades user plan on charge.success |
| `app/api/user/update-plan/route.ts` | Validates plan IDs against billing-store, allocates correct tokens |
| `app/api/user/stats/route.ts` | Returns trial expiry, days left, isTrialExpired — uses session not query param |
| `app/api/auth/signup/route.ts` | New users start on TRIAL (30 posts, 14 days), not "free" with 0 tokens |
| `models/User.ts` | Added trialEndsAt, subscriptionEndDate, pendingPlanId, pendingReference fields |
| `app/page.tsx` | Option 3 positioning ("Attract clients. Stop chasing them."), trial-first CTAs, no AI slugs |
| `app/billing/page.tsx` | Removed Stripe badge (now says "256-bit SSL"), trial status banner, unified plan display |
| `components/UpgradeModal.tsx` | NEW — fires when tokens hit 0 or trial expires. Has social proof + billing CTA |

---

## Deployment Checklist

### 1. Paystack webhook (most critical)
In your Paystack dashboard:
- Go to Settings → API Keys & Webhooks
- Add webhook URL: `https://yourdomain.com/api/paystack/webhook`
- Set the secret key (same as PAYSTACK_SECRET_KEY in your .env)
- Enable events: `charge.success`, `subscription.disable`, `invoice.payment_failed`

### 2. Environment variables — add these if missing
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
```

### 3. MongoDB migration
Run this once to migrate existing "free" plan users to "trial":
```js
db.users.updateMany(
  { plan: "free" },
  {
    $set: {
      plan: "trial",
      tokensRemaining: 30,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  }
)
```

### 4. Wire up UpgradeModal in dashboard
In `app/dashboard/page.tsx`, import and render UpgradeModal:
```tsx
import { UpgradeModal } from "@/components/UpgradeModal"

// In your component state:
const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
const [upgradeReason, setUpgradeReason] = useState<"tokens" | "trial">("tokens")

// When tokens hit 0, replace error toast with:
setUpgradeReason("tokens")
setUpgradeModalOpen(true)

// In JSX:
<UpgradeModal
  open={upgradeModalOpen}
  onClose={() => setUpgradeModalOpen(false)}
  reason={upgradeReason}
/>
```

### 5. Trial expiry check on dashboard load
Add this to your dashboard useEffect:
```tsx
const { isTrialExpired, daysLeftInTrial, currentPlan } = useBillingStore()

useEffect(() => {
  if (currentPlan === "trial" && isTrialExpired()) {
    setUpgradeReason("trial")
    setUpgradeModalOpen(true)
  } else if (currentPlan === "trial" && daysLeftInTrial() <= 2) {
    // Optional: show a non-blocking nudge banner
  }
}, [currentPlan])
```

---

## What's still hardcoded in your old code that needs updating

- `app/dashboard/page.tsx` — plan limits use "pro" and "enterprise" keys. Replace with PLAN_IDS from billing-store.
- `components/Sidebar.tsx` — looks fine, just make sure isPaidPlan() helper is used for lock icons.
- Any place that checks `plan === "free"` — replace with `plan === PLAN_IDS.TRIAL`.

---

## Revenue maximisation notes

1. **Trial countdown banner** — show in sidebar and dashboard header when user has 3 or fewer days left.
2. **Voice profile gate** — free trial gets basic matching. Deep voice profile (the radar chart page) is Strategy+ only. Show a preview with upgrade prompt.
3. **Annual pricing** — billing page now supports yearly toggle. Yearly saves 20%. Add a "Pay annually and get 2 months free" nudge to the trial countdown banner.
4. **Affiliate programme** — coaches and consultants refer colleagues. 25% recurring commission. This is your cheapest customer acquisition channel.
