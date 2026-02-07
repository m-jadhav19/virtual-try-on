'use client';

import { useEffect, useRef, ReactNode } from 'react';

export interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number; // Minimum distance for swipe (px)
  longPressDelay?: number; // ms before long press triggers
  velocityThreshold?: number; // Minimum velocity for swipe (px/ms)
}

interface GestureDetectorProps {
  children: ReactNode;
  config: GestureConfig;
  className?: string;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export default function GestureDetector({
  children,
  config,
  className = ''
}: GestureDetectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<TouchPoint | null>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);

  const {
    threshold = 50,
    longPressDelay = 500,
    velocityThreshold = 0.3,
  } = config;

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Trigger haptic feedback if available
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }
  };

  // Detect swipe direction and trigger callback
  const detectSwipe = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    startTime: number,
    endTime: number
  ) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = Math.max(endTime - startTime, 1); // Avoid division by zero

    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const velocity = distance / deltaTime;

    // Check if velocity meets threshold
    if (velocity < velocityThreshold) return;

    // Determine primary direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          config.onSwipeRight?.();
          triggerHaptic('light');
        } else {
          config.onSwipeLeft?.();
          triggerHaptic('light');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          config.onSwipeDown?.();
          triggerHaptic('light');
        } else {
          config.onSwipeUp?.();
          triggerHaptic('light');
        }
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];

      // Store touch start position and time
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      // Handle pinch gesture (two fingers)
      if (e.touches.length === 2) {
        initialPinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        clearLongPressTimer();
        return;
      }

      // Start long press timer
      if (config.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          config.onLongPress?.();
          triggerHaptic('medium');
          touchStartRef.current = null; // Prevent swipe after long press
        }, longPressDelay);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press if finger moves
      clearLongPressTimer();

      // Handle pinch gesture
      if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialPinchDistanceRef.current;
        config.onPinch?.(scale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      clearLongPressTimer();

      // Reset pinch
      if (e.touches.length < 2) {
        initialPinchDistanceRef.current = null;
      }

      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const { x: startX, y: startY, time: startTime } = touchStartRef.current;
      const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

      // Detect tap vs swipe
      if (distance < 10 && endTime - startTime < 200) {
        // It's a tap
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < 300 && config.onDoubleTap) {
          // Double tap
          config.onDoubleTap();
          triggerHaptic('medium');
          lastTapRef.current = 0; // Reset
        } else {
          // Single tap
          config.onTap?.();
          triggerHaptic('light');
          lastTapRef.current = now;
        }
      } else {
        // It's a swipe
        detectSwipe(startX, startY, endX, endY, startTime, endTime);
      }

      touchStartRef.current = null;
    };

    const clearLongPressTimer = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', clearLongPressTimer, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', clearLongPressTimer);
      clearLongPressTimer();
    };
  }, [config, threshold, longPressDelay, velocityThreshold]);

  return (
    <div ref={containerRef} className={className} style={{ touchAction: 'none' }}>
      {children}
    </div>
  );
}
