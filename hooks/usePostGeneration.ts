import { useState, useCallback } from 'react';
import { GeneratedPost, PostTone, PostLength } from '@/types';

export const usePostGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const generatePosts = useCallback(
    async (input: string, tone: PostTone, postCount: number, postLength: PostLength): Promise<GeneratedPost[]> => {
      if (!input.trim()) return [];

      setIsGenerating(true);
      setGenerationProgress(0);

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: input,
            tone,
            count: postCount,
            length: postLength,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.posts) {
          throw new Error(data.error || 'Failed to generate posts');
        }

        const posts: GeneratedPost[] = data.posts.map((content: string, index: number) => ({
          id: `${index + 1}`,
          content,
          tone,
          engagement: (['Very High', 'High', 'Medium'] as const)[Math.floor(Math.random() * 3)],
          score: Math.floor(Math.random() * 20) + 80,
        }));

        setGenerationProgress(100);
        clearInterval(progressInterval);
        return posts.slice(0, postCount);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error generating posts:', errorMessage);
        setGenerationProgress(100);
        clearInterval(progressInterval);
        return [];
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationProgress(0);
  }, []);

  return { isGenerating, generationProgress, generatePosts, resetGeneration, setIsGenerating };
};