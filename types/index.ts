export type UserPlan = "free" | "pro" | "enterprise"
export type PostTone = "professional" | "friendly" | "assertive" | "inspirational" | "casual" | "thought-provoking"
export type PostLength = "short" | "medium" | "long"
export type EngagementLevel = "Very High" | "High" | "Medium" | "Low"

export interface GeneratedPost {
  id: string
  content: string
  tone?: PostTone
  length?: PostLength
}

export interface PlanLimit {
  maxPosts: number
  name: string
}

export interface MediaType {
  icon: any // Note: In a real application, this should be a specific type (e.g., React.ComponentType)
  label: string
  engagement: string
  color: string
  borderColor: string
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  profile: { firstName: string; lastName: string } | null
  accessToken: string | null
}

export interface PostData {
  content: string
  tone?: PostTone
  length?: PostLength
}

export interface PostResult {
  success: boolean
  postId?: string
  error?: string
}

export interface ToneOption {
  value: PostTone
  label: string
}

export interface LengthOption {
  value: PostLength
  label: string
}

export interface HeaderProps {
  showBackButton?: boolean
  onBack?: () => void
  onMenuClick?: () => void
}

export interface PerformanceOverviewProps {
  posts: GeneratedPost[]
}

export interface PostCardProps {
  post: GeneratedPost
  index: number
  totalPosts: number
  isExpanded: boolean
  onToggleExpand: () => void
  onSchedule: () => void
  onCopy: () => void
  onPostSuccess: (postId: string) => void
  onPostError: (error: string) => void
}

export interface LinkedInAuthButtonProps {
  onAuthenticated?: () => void
  className?: string
}

export interface PostToLinkedInButtonProps {
  content: string
  onSuccess?: (postId: string) => void
  onError?: (error: string) => void
  className?: string
}






// export type UserPlan = 'free' | 'pro' | 'enterprise'

// export type PostTone = 'professional' | 'friendly' | 'assertive' | 'inspirational' | 'casual' | 'thought-provoking'

// export type PostLength = 'short' | 'medium' | 'long'

// export interface PlanLimit {
//   maxPosts: number
//   name: string
// }

// export interface ToneOption {
//   value: PostTone
//   label: string
// }

// export interface LengthOption {
//   value: PostLength
//   label: string
// }


// ```

// **Changes**:
// - Ensured `id` and `content` are required fields in `GeneratedPost`.

// #### Step 6: Test the Flow
// 1. **Replace Files**:
//    - Update `ScheduleModal.tsx`, `Dashboard.tsx`, `app/api/schedule-post/route.ts`, and `types.ts` with the provided versions.
//    - Add or update `usePostGeneration.ts` to ensure valid `id` and `content`.

// 2. **Restart Dev Server**:
//    ```bash
//    npm run dev
//    ```

// 3. **Test API**:
//    ```
//    ```
//    Run:
//    ```bash
//    curl -X POST http://localhost:3000/api/schedule-post -H "Content-Type: application/json" -d '{"postId":"test1","content":"Test LinkedIn post","scheduleTime":"2025-09-03T09:00:00Z","recurring":"daily"}'
//    ```

// 4. **Test Dashboard**:
//    - Open `http://localhost:3000/dashboard`.
//    - Generate posts (e.g., input: “AI trends”, tone: professional, count: 3, length: medium).
//    - Check the console for `Generated posts:` to verify `id` and `content`.
//    - Click **Schedule** on a `PostCard`.
//    - Set 10:00 AM WAT (September 3, 2025 = `2025-09-03T09:00:00Z`), select “Daily”, and confirm.
//    - Check the console for `Scheduling post with data:` and `Sending schedule request:` logs.
//    - Verify the toast (“Post scheduled successfully”) and Atlas (`linkedpilot.schedules`).

// 5. **Check Logs**:
//    - Open VS Code’s terminal or browser console to inspect logs.
//    - If `postId` is `undefined`, note the output of `console.log("Scheduling post with data:", scheduleData)` and `console.log("Received schedule request:", body)`.

// #### Step 7: Deploy
// 1. **Commit**:
//    ```bash
//    git add .
//    git commit -m "Fix TypeError in schedule-post by adding logging and validation"
//    git push origin main
//    ```

// 2. **Deploy**:
//    ```bash
//    vercel --prod
//    ```

// 3. **Monitor**:
//    ```bash
//    vercel logs <your-vercel-app>.vercel.app -f
//    ```

// #### Troubleshooting
// - **Persistent TypeError**:
//   - Check console logs for `Generated posts:`, `Scheduling post with data:`, and `Received schedule request:`.
//   - If `postId` is `undefined`, share `usePostGeneration.ts` or the console output.
// - **Atlas Connection**:
//   - Verify your IP (`curl https://ipinfo.io/ip`) in Atlas **Network Access**.
//   - Test with `mongosh`:
//     ```bash
//     mongosh "mongodb+srv://<user>:<password>@ac-pzfdohs.gnx6u31.mongodb.net/linkedpilot"
//     ```
// - **LinkedIn Issues**:
//   - If posting fails, share `lib/linkedin.ts` or `useLinkedInPosting`.

// ### Next Steps
// 1. Replace the updated files (`ScheduleModal.tsx`, `Dashboard.tsx`, `app/api/schedule-post/route.ts`, `types.ts`).
// 2. Add or update `usePostGeneration.ts` with the sample if needed.
// 3. Install `uuid` and `@types/uuid`.
// 4. Test locally and check console logs.
// 5. Share `usePostGeneration.ts` or logs if the error persists.

// This should resolve the `TypeError` by ensuring valid `postId` values. Let me know the console output or any new errors!