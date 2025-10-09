import { IconType } from 'lucide-react';

export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface PlanLimit {
  maxPosts: number;
  name: string;
}

export type PostTone = 'professional' | 'friendly' | 'assertive' | 'inspirational' | 'casual' | 'thought-provoking';

export type PostLength = 'short' | 'medium' | 'long';

export interface ToneOption {
  value: PostTone;
  label: string;
}

export interface LengthOption {
  value: PostLength;
  label: string;
}

export interface GeneratedPost {
  id?: string;
  content: string;
  engagement?: string;
  score?: number;
}

export interface ViralIdea {
  id: number;
  category: 'Controversial' | 'Question' | 'Story' | 'List' | 'Career Advice';
  hook: string;
  engagement: 'Very High' | 'High' | 'Medium';
  score: number;
  keywords: string[];
}

export interface MediaType {
  icon: IconType;
  label: string;
  engagement: string;
  color: string;
  borderColor: string;
}

export interface PostCardProps {
  post: GeneratedPost;
  index: number;
  totalPosts: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSchedule: () => void;
  onCopy: () => void;
  onPostSuccess: (postId: string) => void;
  onPostError: (error: string) => void;
}