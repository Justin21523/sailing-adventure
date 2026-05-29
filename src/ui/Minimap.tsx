/**
 * Minimap.tsx
 * Circular radar/navigation chart rendered via HTML Canvas.
 * Shows ship position (center), surrounding islands, loot, and compass bearings.
 */

import { useEffect, useRef } from 'react';
import { gameWorld } from '@/core/engine/GameWorld';
import { eventSystem } from '@/core/systems/EventSystem';
import type { IslandData } from '@/core/systems/ChunkManager';

interface MinimapProps {
  islands: IslandData[];
}

const MAP_SIZE = 220;
const WORLD_RADIUS = 300;
const SCALE = MAP_SIZE / (WORLD_RADIUS * 2.5);

export function Minimap({ islands }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

      const cx = MAP_SIZE / 2;
      const cy = MAP_SIZE / 2;
      const r = MAP_SIZE / 2;

      // 1. Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.clip();

      // Background
      ctx.fillStyle = 'rgba(10, 25, 47, 0.90)';
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

      // Radar grid rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      for (const fraction of [0.25, 0.5, 0.75]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * fraction, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshair lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, MAP_SIZE);
      ctx.moveTo(0, cy); ctx.lineTo(MAP_SIZE, cy);
      ctx.stroke();

      const shipPos = gameWorld.shipPhysics.position;
      const shipHeading = gameWorld.shipPhysics.heading;

      const toMapX = (worldX: number) => cx + (worldX - shipPos.x) * SCALE;
      const toMapY = (worldZ: number) => cy + (worldZ - shipPos.z) * SCALE;

      // 2. Draw Islands
      for (const island of islands) {
        const mx = toMapX(island.position[0]);
        const my = toMapY(island.position[2]);
        const distToCenter = Math.hypot(mx - cx, my - cy);
        if (distToCenter < r - 6) {
          // Island body
          const radius = 3 + island.scale * 1.5;
          ctx.fillStyle = '#4A7C59';
          ctx.shadowColor = '#6DBF7E';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(mx, my, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Off-screen: draw edge indicator
          const angle = Math.atan2(my - cy, mx - cx);
          const edgeX = cx + Math.cos(angle) * (r - 10);
          const edgeY = cy + Math.sin(angle) * (r - 10);
          ctx.fillStyle = 'rgba(74, 124, 89, 0.6)';
          ctx.beginPath();
          ctx.arc(edgeX, edgeY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Draw Loot
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 3;
      for (const loot of eventSystem.activeLoot) {
        const mx = toMapX(loot.position[0]);
        const my = toMapY(loot.position[2]);
        const distToCenter = Math.hypot(mx - cx, my - cy);
        if (distToCenter < r - 6) {
          ctx.fillRect(mx - 2.5, my - 2.5, 5, 5);
        }
      }
      ctx.shadowBlur = 0;

      // 4. Ship (center, white triangle pointing to heading)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(shipHeading);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(-5, 7);
      ctx.lineTo(5, 7);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.restore(); // end clip

      // 5. Outer border ring
      ctx.strokeStyle = 'rgba(230, 241, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Compass direction labels (N/E/S/W) — drawn outside clip so always visible
      const labels: Array<{ label: string; angle: number; color: string }> = [
        { label: 'N', angle: -Math.PI / 2, color: '#FFE066' },
        { label: 'E', angle: 0,            color: 'rgba(230,241,255,0.7)' },
        { label: 'S', angle: Math.PI / 2,  color: 'rgba(230,241,255,0.7)' },
        { label: 'W', angle: Math.PI,      color: 'rgba(230,241,255,0.7)' },
      ];
      ctx.font = 'bold 10px "Roboto Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const dir of labels) {
        const lx = cx + Math.cos(dir.angle) * (r - 9);
        const ly = cy + Math.sin(dir.angle) * (r - 9);
        ctx.fillStyle = dir.color;
        ctx.fillText(dir.label, lx, ly);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [islands]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_SIZE}
      height={MAP_SIZE}
      className="rounded-full shadow-2xl border-2 border-sand-light/20"
    />
  );
}
