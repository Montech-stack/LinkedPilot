import { useState, useRef, useCallback, useEffect } from 'react';

const MIN_SCALE = 0.3;
const MAX_SCALE = 3.0;

export const useCanvas = () => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Center the canvas initially
  useEffect(() => {
    setOffset({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;

    setScale((prevScale) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prevScale * delta));

      // Calculate zoom towards pointer
      // We need to adjust offset so the point under cursor remains stationary
      // This is a simplified version; for now let's just zoom center or near center if complexities arise
      // But standard implementation:
      // worldX = (mouseX - offsetX) / scale
      // newOffset = mouseX - worldX * newScale

      // Current world position of mouse
      // const mouseX = e.clientX;
      // const mouseY = e.clientY;

      // const worldX = (mouseX - offset.x) / prevScale;
      // const worldY = (mouseY - offset.y) / prevScale;

      // const newOffsetX = mouseX - worldX * newScale;
      // const newOffsetY = mouseY - worldY * newScale;

      // setOffset({ x: newOffsetX, y: newOffsetY });

      return newScale;
    });
  }, []);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Smoothly animate to a target position and scale
  const flyTo = useCallback((targetX, targetY, targetScale = 1.0, duration = 1000) => {
    const startX = offset.x;
    const startY = offset.y;
    const startScale = scale;
    const startTime = performance.now();

    // We want to center the targetX, targetY on the screen.
    // The offset in our canvas usually represents the translation.
    // If we render nodes at (x, y) with transform(offset + x*scale).
    // To center (targetX, targetY):
    // CenterScreen = Offset + Target * Scale
    // Offset = CenterScreen - Target * Scale

    // Wait, let's verify how Canvas renders.
    // Canvas.jsx: transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
    // Node at node.x, node.y. 
    // ScreenPos = offset + node * scale.
    // We want ScreenPos = ScreenCenter.
    // offset = ScreenCenter - node * scale.

    const screenCX = window.innerWidth / 2;
    const screenCY = window.innerHeight / 2;

    const finalOffsetX = screenCX - targetX * targetScale;
    const finalOffsetY = screenCY - targetY * targetScale;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeInOutCubic
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentScale = startScale + (targetScale - startScale) * ease;
      const currentOffsetX = startX + (finalOffsetX - startX) * ease;
      const currentOffsetY = startY + (finalOffsetY - startY) * ease;

      setScale(currentScale);
      setOffset({ x: currentOffsetX, y: currentOffsetY });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [offset, scale]);

  return {
    scale,
    offset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setScale, // exported for zoom buttons
    setOffset, // exported for reset
    flyTo // exported for animations
  };
};
