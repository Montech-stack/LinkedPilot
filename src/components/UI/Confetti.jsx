import React, { useEffect, useRef } from 'react';

const COLORS = ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#7C3AED', '#34D399', '#F472B6', '#FBBF24'];
const PARTICLE_COUNT = 80;

const Confetti = ({ active }) => {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const particlesRef = useRef([]);

    useEffect(() => {
        if (!active) {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            particlesRef.current = [];
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Create particles
        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: canvas.height * 0.4,
            vx: (Math.random() - 0.5) * 12,
            vy: -Math.random() * 14 - 4,
            size: Math.random() * 8 + 4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 12,
            opacity: 1,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
            gravity: 0.25 + Math.random() * 0.1,
            drag: 0.98 + Math.random() * 0.01
        }));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;

            particlesRef.current.forEach(p => {
                p.vy += p.gravity;
                p.vx *= p.drag;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotSpeed;
                p.opacity -= 0.008;

                if (p.opacity <= 0) return;
                alive = true;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;

                if (p.shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });

            if (alive) {
                animRef.current = requestAnimationFrame(animate);
            }
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [active]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 100
            }}
        />
    );
};

export default Confetti;
