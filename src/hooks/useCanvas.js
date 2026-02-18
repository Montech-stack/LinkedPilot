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

  return {
    scale,
    offset,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setScale, // exported for zoom buttons
    setOffset // exported for reset
  };
};
