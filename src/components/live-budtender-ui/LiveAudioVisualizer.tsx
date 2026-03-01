import { useRef, useEffect } from 'react';
import type { LiveSessionStatus } from '../../lib/types';

interface LiveAudioVisualizerProps {
    userLevel: number;
    aiLevel: number;
    status: LiveSessionStatus;
}

const BAR_COUNT = 24;
const GREEN_NEON = '#39FF14';
const AI_COLOR = '#ffffff';

export default function LiveAudioVisualizer({ userLevel, aiLevel, status }: LiveAudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const userHistory = useRef<number[]>(new Array(BAR_COUNT).fill(0));
    const aiHistory = useRef<number[]>(new Array(BAR_COUNT).fill(0));
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            // Push new levels into history
            userHistory.current.push(userLevel);
            userHistory.current.shift();
            aiHistory.current.push(aiLevel);
            aiHistory.current.shift();

            const centerX = width / 2;
            const barWidth = Math.max(2, (width / 2 - 40) / BAR_COUNT - 1);
            const maxHeight = height * 0.7;
            const baseY = height / 2;

            // Draw user bars (left side, green neon)
            for (let i = 0; i < BAR_COUNT; i++) {
                const val = userHistory.current[i];
                const h = Math.max(2, val * maxHeight);
                const x = centerX - 20 - (BAR_COUNT - i) * (barWidth + 1);
                const alpha = 0.3 + val * 0.7;

                ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
                ctx.beginPath();
                ctx.roundRect(x, baseY - h / 2, barWidth, h, 1);
                ctx.fill();

                // Mirror glow
                ctx.fillStyle = `rgba(57, 255, 20, ${alpha * 0.15})`;
                ctx.beginPath();
                ctx.roundRect(x, baseY - h / 2 - 2, barWidth, h + 4, 2);
                ctx.fill();
            }

            // Draw AI bars (right side, white)
            for (let i = 0; i < BAR_COUNT; i++) {
                const val = aiHistory.current[i];
                const h = Math.max(2, val * maxHeight);
                const x = centerX + 20 + i * (barWidth + 1);
                const alpha = 0.3 + val * 0.7;

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.roundRect(x, baseY - h / 2, barWidth, h, 1);
                ctx.fill();

                // Mirror glow
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
                ctx.beginPath();
                ctx.roundRect(x, baseY - h / 2 - 2, barWidth, h + 4, 2);
                ctx.fill();
            }

            // Center divider - pulsing orb
            const orbRadius = 6 + (status === 'ai_speaking' ? aiLevel * 8 : status === 'listening' ? userLevel * 8 : 0);
            const orbColor = status === 'ai_speaking' ? AI_COLOR : GREEN_NEON;
            const gradient = ctx.createRadialGradient(centerX, baseY, 0, centerX, baseY, orbRadius + 10);
            gradient.addColorStop(0, orbColor);
            gradient.addColorStop(0.5, `${orbColor}44`);
            gradient.addColorStop(1, `${orbColor}00`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, baseY, orbRadius + 10, 0, Math.PI * 2);
            ctx.fill();

            // Inner orb
            ctx.fillStyle = orbColor;
            ctx.beginPath();
            ctx.arc(centerX, baseY, orbRadius, 0, Math.PI * 2);
            ctx.fill();

            // Labels
            ctx.font = '9px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(57, 255, 20, 0.5)`;
            ctx.fillText('VOUS', centerX - (width / 4), height - 8);
            ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
            ctx.fillText('BUDTENDER', centerX + (width / 4), height - 8);

            animRef.current = requestAnimationFrame(draw);
        };

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        });
        resizeObserver.observe(canvas);

        animRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animRef.current);
            resizeObserver.disconnect();
        };
    }, [userLevel, aiLevel, status]);

    return (
        <div className="relative w-full h-24 sm:h-28">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
            />
            {/* Idle state placeholder */}
            {status === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-zinc-600 font-medium">En attente de connexion...</p>
                </div>
            )}
        </div>
    );
}
