
import { IScheduledPost } from "@/models/ScheduledPost";

export interface SchedulerPost extends Omit<IScheduledPost, "scheduledAt"> {
    _id: string; // Ensure ID is string on client
    scheduledAt?: string | Date; // Allow string for serialization
    isDraft?: boolean; // New field for drafts
}

export interface DragItem {
    id: string;
    type: "POST" | "DRAFT";
    data: SchedulerPost;
}

export type ViewMode = "month" | "week";
