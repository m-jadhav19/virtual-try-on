'use client';

import { useEffect, useState, useRef } from 'react';

interface AmbientLightDetectorProps {
  videoElement?: HTMLVideoElement | null;
  onLightChange?: (brightness: number) => void;
  sampleInterval?: number; // ms between samples
}

export default function AmbientLightDetector({
  videoElement,
  onLightChange,
  sampleInterval = 500,
}: AmbientLightDetectorProps) {
  const [brightness, setBrightness] = useState(0.5);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoElement) return;

    // Create off-screen canvas for sampling
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 100;
      canvasRef.current.height = 100;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const detectLight = () => {
      if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        // Draw current video frame to canvas
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate average brightness
        let totalBrightness = 0;
        const pixelCount = canvas.width * canvas.height;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate perceived brightness (weighted for human perception)
          const perceivedBrightness = (0.299 * r + 0.587 * g + 0.114 * b);
          totalBrightness += perceivedBrightness;
        }

        const avgBrightness = totalBrightness / pixelCount;
        const normalizedBrightness = avgBrightness / 255; // 0-1 range

        // Smooth the brightness value to avoid jitter
        setBrightness((prev) => prev * 0.7 + normalizedBrightness * 0.3);

        // Notify parent
        if (onLightChange) {
          onLightChange(normalizedBrightness);
        }
      } catch (err) {
        // Silently fail if video isn't ready
      }
    };

    // Start sampling
    intervalRef.current = setInterval(detectLight, sampleInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoElement, onLightChange, sampleInterval]);

  // This component doesn't render anything
  return null;
}

// Export a hook version for easier use
export function useAmbientLight(
  videoElement?: HTMLVideoElement | null,
  sampleInterval = 500
): number {
  const [brightness, setBrightness] = useState(0.5);

  useEffect(() => {
    if (!videoElement) return;

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const detectLight = () => {
      if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalBrightness = 0;
        const pixelCount = canvas.width * canvas.height;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const perceivedBrightness = (0.299 * r + 0.587 * g + 0.114 * b);
          totalBrightness += perceivedBrightness;
        }

        const avgBrightness = totalBrightness / pixelCount;
        const normalizedBrightness = avgBrightness / 255;

        setBrightness((prev) => prev * 0.7 + normalizedBrightness * 0.3);
      } catch (err) {
        // Silently fail
      }
    };

    const interval = setInterval(detectLight, sampleInterval);
    return () => clearInterval(interval);
  }, [videoElement, sampleInterval]);

  return brightness;
}
