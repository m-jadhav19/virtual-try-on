'use client';

import { useEffect, useState } from 'react';

interface GestureHintProps {
  onDismiss?: () => void;
}

const HINTS = [
  {
    id: 'swipe',
    icon: '👆',
    text: 'Swipe left or right to change categories',
    duration: 3000,
  },
  {
    id: 'longpress',
    icon: '📸',
    text: 'Hold to capture',
    duration: 2500,
  },
  {
    id: 'tap',
    icon: '✨',
    text: 'Tap for focus mode',
    duration: 2500,
  },
];

export default function GestureHints({ onDismiss }: GestureHintProps) {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has seen hints before
    const hasSeenHints = localStorage.getItem('hasSeenGestureHints');
    if (hasSeenHints) {
      setDismissed(true);
      setVisible(false);
      return;
    }

    // Show hints sequentially
    const hint = HINTS[currentHintIndex];
    const timer = setTimeout(() => {
      if (currentHintIndex < HINTS.length - 1) {
        setCurrentHintIndex((prev) => prev + 1);
      } else {
        // All hints shown, dismiss
        setVisible(false);
        localStorage.setItem('hasSeenGestureHints', 'true');
        onDismiss?.();
      }
    }, hint.duration);

    return () => clearTimeout(timer);
  }, [currentHintIndex, onDismiss]);

  const handleManualDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('hasSeenGestureHints', 'true');
    onDismiss?.();
  };

  if (dismissed || !visible) return null;

  const currentHint = HINTS[currentHintIndex];

  return (
    <div
      className="gesture-hint"
      style={{
        position: 'fixed',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        padding: '16px 24px',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '90%',
        animation: 'slideUpFade 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'auto',
      }}
      onClick={handleManualDismiss}
    >
      <div style={{ fontSize: '24px' }}>{currentHint.icon}</div>
      <div
        style={{
          color: 'white',
          fontSize: '14px',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontWeight: '400',
        }}
      >
        {currentHint.text}
      </div>
      <button
        onClick={handleManualDismiss}
        style={{
          marginLeft: '8px',
          padding: '4px 8px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '8px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        Got it
      </button>

      <style jsx>{`
        @keyframes slideUpFade {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .gesture-hint:hover {
          background: rgba(0, 0, 0, 0.9);
        }
      `}</style>
    </div>
  );
}
