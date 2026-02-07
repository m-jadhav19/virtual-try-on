'use client';

import { useEffect, useRef } from 'react';

type TrackingState = 'locked' | 'lost' | 'searching';

interface SmartTrackingFeedbackProps {
  trackingState: TrackingState;
  landmarkPosition?: { x: number; y: number };
}

export default function SmartTrackingFeedback({
  trackingState,
  landmarkPosition,
}: SmartTrackingFeedbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (trackingState === 'locked' && landmarkPosition) {
      // Draw soft outline glow
      const glowRadius = 150;
      const gradient = ctx.createRadialGradient(
        landmarkPosition.x,
        landmarkPosition.y,
        0,
        landmarkPosition.x,
        landmarkPosition.y,
        glowRadius
      );

      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
      gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (trackingState === 'lost' && landmarkPosition) {
      // Draw pulsing circle
      const pulseRadius = 80;
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(landmarkPosition.x, landmarkPosition.y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (trackingState === 'searching') {
      // Draw directional hint (center of screen)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // Draw crosshair
      ctx.beginPath();
      ctx.moveTo(centerX - 30, centerY);
      ctx.lineTo(centerX + 30, centerY);
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX, centerY + 30);
      ctx.stroke();
    }
  }, [trackingState, landmarkPosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="smart-tracking-feedback"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20,
        animation: trackingState === 'lost' ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }}
    >
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </canvas>
  );
}
