'use client';

import { Camera } from 'lucide-react';
import { useState } from 'react';

interface CaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
}

export default function CaptureButton({ onCapture, disabled = false }: CaptureButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (disabled || isCapturing) return;

    setIsCapturing(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Call capture handler
    await onCapture();

    setTimeout(() => setIsCapturing(false), 500);
  };

  return (
    <button
      onClick={handleCapture}
      disabled={disabled || isCapturing}
      className="capture-button"
      style={{
        position: 'fixed',
        bottom: '120px', // Above category nav
        left: '50%',
        transform: 'translateX(-50%)',
        width: '200px',
        height: '56px',
        padding: '0 24px',
        background: disabled
          ? 'rgba(100, 100, 100, 0.5)'
          : 'linear-gradient(135deg, #00f0ff, #00b8cc)',
        border: 'none',
        borderRadius: '28px',
        boxShadow: disabled
          ? 'none'
          : '0 0 24px rgba(0, 240, 255, 0.4)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '500',
        fontFamily: 'Inter, -apple-system, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        zIndex: 35,
        transition: 'all 150ms ease-out',
        animation: disabled ? 'none' : 'pulse 2s ease-in-out infinite',
        opacity: isCapturing ? 0.8 : 1,
      }}
    >
      <Camera size={24} />
      <span>{isCapturing ? 'Capturing...' : 'Capture'}</span>

      {/* Flash overlay */}
      {isCapturing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'white',
            zIndex: 999,
            animation: 'flash 100ms ease-out',
            pointerEvents: 'none',
          }}
        />
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
          }
          50% {
            transform: translateX(-50%) scale(1.02);
          }
        }

        @keyframes flash {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .capture-button:hover:not(:disabled) {
          transform: translateX(-50%) scale(1.05);
          box-shadow: 0 0 32px rgba(0, 240, 255, 0.6);
        }

        .capture-button:active:not(:disabled) {
          transform: translateX(-50%) scale(0.95);
        }
      `}</style>
    </button>
  );
}
