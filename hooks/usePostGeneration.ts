
import { useState, useCallback } from 'react';
import { GeneratedPost } from '@/types';

export function usePostGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  const generatePosts = useCallback(async (
    idea: string,
    platforms: string[],
    count: number,
    length: string
  ): Promise<GeneratedPost[]> => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea,
          platforms,
          length,
          count,
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to generate posts: ${response.status}`);
      }

      const data = await response.json();
      if (!data.posts || !Array.isArray(data.posts)) {
        throw new Error('Invalid response format: Expected posts array');
      }

      return data.posts.map((post: { content: string; platform?: string }, index: number) => ({
        id: `post-${Date.now()}-${index}`,
        content: post.content,
        platform: post.platform,
        engagement: ['Low', 'Medium', 'High', 'Very High'][Math.floor(Math.random() * 4)],
        score: Math.floor(Math.random() * 26) + 70,
      })) as GeneratedPost[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.log('Error generating posts:', errorMessage);
      return [];
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  }, []);

  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setError(null);
    setGenerationProgress(0);
  }, []);

  return {
    generatePosts,
    isGenerating,
    error,
    generationProgress,
    resetGeneration,
    setIsGenerating,
  };
}