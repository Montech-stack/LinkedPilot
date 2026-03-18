import { useState, useCallback, useEffect, useRef } from 'react';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4.0;

export const useCanvas = () => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Refs — zero stale-closure animations & instant drag response
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);

  // Mouse drag
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, offsetX: 0, offsetY: 0 });

  // Touch state
  const touchStartRef = useRef({ touches: [], offsetX: 0, offsetY: 0, scale: 1 });

  const applyScale = useCallback((s) => { scaleRef.current = s; setScale(s); }, []);
  const applyOffset = useCallback((o) => { offsetRef.current = o; setOffset(o); }, []);

  // Centre on mount
  useEffect(() => {
    const initial = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    applyOffset(initial);
  }, []);

  // ── Wheel zoom (mouse) ─────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }

    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleRef.current * factor));
    const worldX = (e.clientX - offsetRef.current.x) / scaleRef.current;
    const worldY = (e.clientY - offsetRef.current.y) / scaleRef.current;
    applyScale(newScale);
    applyOffset({ x: e.clientX - worldX * newScale, y: e.clientY - worldY * newScale });
  }, [applyScale, applyOffset]);

  // ── Mouse drag pan ─────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX, clientY: e.clientY,
      offsetX: offsetRef.current.x, offsetY: offsetRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    if (!hasDraggedRef.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    hasDraggedRef.current = true;
    applyOffset({ x: dragStartRef.current.offsetX + dx, y: dragStartRef.current.offsetY + dy });
  }, [applyOffset]);

  const handleMouseUp = useCallback(() => { isDraggingRef.current = false; }, []);

  // ── Touch: single-finger pan + two-finger pinch-zoom ──────────────────
  const handleTouchStart = useCallback((e) => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    touchStartRef.current = {
      touches,
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
      scale: scaleRef.current,
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    const start = touchStartRef.current;
    if (!start.touches.length) return;

    if (touches.length === 1 && start.touches.length >= 1) {
      // Single-finger pan
      const dx = touches[0].x - start.touches[0].x;
      const dy = touches[0].y - start.touches[0].y;
      applyOffset({ x: start.offsetX + dx, y: start.offsetY + dy });

    } else if (touches.length === 2 && start.touches.length >= 2) {
      // Pinch-to-zoom
      const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
      const startDist = dist(start.touches[0], start.touches[1]);
      const currDist = dist(touches[0], touches[1]);
      if (startDist < 1) return;

      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, start.scale * (currDist / startDist)));

      // Midpoint of current touch
      const midX = (touches[0].x + touches[1].x) / 2;
      const midY = (touches[0].y + touches[1].y) / 2;
      // Midpoint of start touch
      const startMidX = (start.touches[0].x + start.touches[1].x) / 2;
      const startMidY = (start.touches[0].y + start.touches[1].y) / 2;

      // World point under start midpoint
      const worldX = (startMidX - start.offsetX) / start.scale;
      const worldY = (startMidY - start.offsetY) / start.scale;

      // New offset: keep world point under current midpoint + apply pan delta
      const panDx = midX - startMidX;
      const panDy = midY - startMidY;
      applyScale(newScale);
      applyOffset({
        x: midX - worldX * newScale + panDx - (midX - startMidX),
        y: midY - worldY * newScale + panDy - (midY - startMidY),
      });
    }
  }, [applyOffset, applyScale]);

  const handleTouchEnd = useCallback((e) => {
    // Update start ref to remaining touches (allows smooth 2→1 finger transition)
    const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    touchStartRef.current = {
      touches,
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
      scale: scaleRef.current,
    };
  }, []);

  // ── Smooth fly-to animation — stable with refs, no deps needed ─────────
  const flyTo = useCallback((targetX, targetY, targetScale = 1.0, duration = 900) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
      scaleRef.current = s; offsetRef.current = { x: ox, y: oy };
      setScale(s); setOffset({ x: ox, y: oy });
      if (t < 1) animFrameRef.current = requestAnimationFrame(animate);
      else animFrameRef.current = null;
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  return {
    scale, offset,
    handleWheel,
    handleMouseDown, handleMouseMove, handleMouseUp,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    setScale: applyScale,
    setOffset: applyOffset,
    flyTo,
    isDragging: () => hasDraggedRef.current,
  };
};
