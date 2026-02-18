
import React from "react";
import { SchedulerPost } from "./types";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface ReliabilityTableProps {
    posts: SchedulerPost[];
}

export default function ReliabilityTable({ posts }: ReliabilityTableProps) {
    if (posts.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                No logs found.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-4 font-medium">Date & Time</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Platform</th>
                        <th className="px-6 py-4 font-medium">Content Preview</th>
                        <th className="px-6 py-4 font-medium">Result / Error</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {posts.map((post) => {
                        const status = getStatus(post);
                        return (
                            <tr key={post._id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {post.scheduledAt
                                        ? new Date(post.scheduledAt).toLocaleString()
                                        : <span className="text-slate-500 italic">Unscheduled</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                                    {post.platform}
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={post.content}>
                                    {post.content}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {post.error ? (
                                        <span className="text-red-400 flex items-center gap-1.5" title={post.error}>
                                            <AlertTriangle size={14} />
                                            {post.error.substring(0, 30)}{post.error.length > 30 ? "..." : ""}
                                        </span>
                                    ) : post.posted ? (
                                        <span className="text-emerald-400 select-none">-</span>
                                    ) : (
                                        <span className="text-slate-600 select-none">-</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

type Status = "posted" | "scheduled" | "failed" | "draft";

function getStatus(post: SchedulerPost): Status {
    if (post.posted) return "posted";
    if (post.error) return "failed";
    if (post.isDraft) return "draft";
    return "scheduled";
}

function StatusBadge({ status }: { status: Status }) {
    const styles = {
        posted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        failed: "bg-red-500/10 text-red-400 border-red-500/20",
        draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };

    const icons = {
        posted: <CheckCircle size={12} />,
        scheduled: <Clock size={12} />,
        failed: <XCircle size={12} />,
        draft: <div className="w-2 h-2 rounded-full bg-slate-400/50" />,
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
            {icons[status]}
            <span className="capitalize">{status}</span>
        </span>
    );
}
