import React, { useEffect, useRef } from 'react';
import { Particle } from '../types';

export interface ParticleSettings {
    speedMultiplier: number;
    colorMode: 'yellow' | 'blue' | 'pink' | 'multicolor' | 'white' | 'default';
    densityMultiplier: number;
}

interface ParticleCanvasProps {
    settingsRef?: React.MutableRefObject<ParticleSettings>;
}

const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ settingsRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const mouse = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0; // Time accumulator for rhythm

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.x;
            mouse.current.y = e.y;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouse.current.x = e.touches[0].clientX;
                mouse.current.y = e.touches[0].clientY;
            }
        };

        const handleLeave = () => {
            mouse.current.x = null;
            mouse.current.y = null;
        };

        const initParticles = () => {
            particles.current = [];
            // Increased density for more "vibe"
            const count = window.innerWidth < 768 ? 80 : 180;
            for (let i = 0; i < count; i++) {
                particles.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    baseX: Math.random() * canvas.width,
                    baseY: Math.random() * canvas.height,
                    size: Math.random() * 2 + 1, // Slightly larger
                    speedX: (Math.random() - 0.5) * 1,
                    speedY: (Math.random() - 0.5) * 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };

        const animate = () => {
            time += 0.05;
            const settings = settingsRef?.current || { speedMultiplier: 1, colorMode: 'default', densityMultiplier: 1 };
            
            // ALWAYS clear rect to ensure transparency for layers behind (like the "Hagamos Historia" text)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const scrollY = window.scrollY;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = Math.min(scrollY / docHeight, 1);
            
            // Base Rhythm (Heartbeat) calculation
            const heartbeat = Math.sin(time) * 0.5 + 1; // Pulses between 0.5 and 1.5
            
            // Effective Speed
            let speedMultiplier = settings.speedMultiplier;
            // If default, use scroll AND heartbeat
            if (!settingsRef && settings.speedMultiplier === 1) {
                 speedMultiplier = 1 + (scrollPercent * 10) + (heartbeat * 0.5);
            } else {
                 // Even with overrides, add the heartbeat
                 speedMultiplier += (heartbeat * 0.2);
            }

            // Determine Color
            let fillStyle = '#D4AF37';
            if (settings.colorMode === 'blue') fillStyle = '#00B4D8';
            else if (settings.colorMode === 'pink') fillStyle = '#E91E63';
            else if (settings.colorMode === 'white') fillStyle = '#FFFFFF';
            else if (settings.colorMode === 'multicolor') fillStyle = 'multicolor';
            else {
                 fillStyle = scrollPercent > 0.4 ? '#E91E63' : '#D4AF37';
            }

            particles.current.forEach(p => {
                // Apply Movement
                p.baseX += p.speedX * speedMultiplier;
                p.baseY += p.speedY * speedMultiplier;

                // Vertical drift (Warp)
                if (speedMultiplier > 3) {
                     p.baseY -= speedMultiplier * 0.8;
                }

                // Wrap around
                if (p.baseX > canvas.width) p.baseX = 0;
                if (p.baseX < 0) p.baseX = canvas.width;
                if (p.baseY > canvas.height) p.baseY = 0;
                if (p.baseY < 0) p.baseY = canvas.height;

                // Mouse Repulsion
                let dx = 0;
                let dy = 0;
                if (mouse.current.x != null && mouse.current.y != null) {
                    const distDx = mouse.current.x - p.baseX;
                    const distDy = mouse.current.y - p.baseY;
                    const distance = Math.sqrt(distDx * distDx + distDy * distDy);
                    const interactionRadius = 250;

                    if (distance < interactionRadius) {
                        const force = (interactionRadius - distance) / interactionRadius;
                        const push = force * 50;
                        dx = -(distDx / distance) * push;
                        dy = -(distDy / distance) * push;
                    }
                }

                // Add "Vibration" from the beat
                const beatOffset = Math.cos(time * 2 + p.x) * (speedMultiplier * 0.5);

                p.x = p.baseX + dx + beatOffset;
                p.y = p.baseY + dy + beatOffset;

                // Draw
                ctx.globalAlpha = p.opacity;
                
                if (fillStyle === 'multicolor') {
                    const rnd = Math.random();
                    if (rnd > 0.66) ctx.fillStyle = '#D4AF37';
                    else if (rnd > 0.33) ctx.fillStyle = '#E91E63';
                    else ctx.fillStyle = '#00B4D8';
                } else {
                    ctx.fillStyle = fillStyle;
                }
                
                // Draw Particle (Circle or Streak)
                ctx.beginPath();
                if (speedMultiplier > 4) {
                    // Warp Streak (Creates the "speed" look without needing background trails)
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x, p.y + (p.size * speedMultiplier));
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.lineWidth = p.size;
                    ctx.stroke();
                } else {
                    // Normal Circle with slight pulse in size
                    const pulsatedSize = p.size * (1 + (heartbeat * 0.2));
                    ctx.arc(p.x, p.y, pulsatedSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchMove, { passive: true });
        window.addEventListener('mouseout', handleLeave);
        window.addEventListener('touchend', handleLeave);
        
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchMove);
            window.removeEventListener('mouseout', handleLeave);
            window.removeEventListener('touchend', handleLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [settingsRef]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 z-[1] pointer-events-none mix-blend-screen"
        />
    );
};

export default ParticleCanvas;