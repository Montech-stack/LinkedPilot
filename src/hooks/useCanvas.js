import { useState, useCallback, useEffect, useRef } from 'react';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4.0;

export const useCanvas = () => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Refs for zero-stale-closure animations and drag tracking
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, offsetX: 0, offsetY: 0 });

  // Setters that keep refs in sync
  const applyScale = useCallback((s) => {
    scaleRef.current = s;
    setScale(s);
  }, []);

  const applyOffset = useCallback((o) => {
    offsetRef.current = o;
    setOffset(o);
  }, []);

  // Center canvas on mount
  useEffect(() => {
    const initial = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    applyOffset(initial);
  }, []);

  // Wheel zoom: zoom toward cursor
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * factor));
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const worldX = (mouseX - offsetRef.current.x) / scaleRef.current;
    const worldY = (mouseY - offsetRef.current.y) / scaleRef.current;
    const newOffset = {
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale,
    };
    applyScale(newScale);
    applyOffset(newOffset);
  }, [applyScale, applyOffset]);

  // Drag pan
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (!hasDraggedRef.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    hasDraggedRef.current = true;
    applyOffset({
      x: dragStartRef.current.offsetX + dx,
      y: dragStartRef.current.offsetY + dy,
    });
  }, [applyOffset]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Fly-to animation — uses refs, no stale closures, zero dependencies
  const flyTo = useCallback((targetX, targetY, targetScale = 1.0, duration = 900) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    const startX = offsetRef.current.x;
    const startY = offsetRef.current.y;
    const startScale = scaleRef.current;
    const startTime = performance.now();
    const screenCX = window.innerWidth / 2;
    const screenCY = window.innerHeight / 2;
    const finalOffsetX = screenCX - targetX * targetScale;
    const finalOffsetY = screenCY - targetY * targetScale;

    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const s = startScale + (targetScale - startScale) * ease;
      const ox = startX + (finalOffsetX - startX) * ease;
      const oy = startY + (finalOffsetY - startY) * ease;
      scaleRef.current = s;
      offsetRef.current = { x: ox, y: oy };
      setScale(s);
      setOffset({ x: ox, y: oy });
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, []); // No deps — reads from refs

  return {
    scale,
    offset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setScale: applyScale,
    setOffset: applyOffset,
    flyTo,
    isDragging: () => hasDraggedRef.current,
  };
};
