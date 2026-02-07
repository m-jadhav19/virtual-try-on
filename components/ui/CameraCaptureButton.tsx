'use client';

import { useState } from 'react';

interface CameraCaptureButtonProps {
  onCapture: () => void;
  disabled?: boolean;
}

export default function CameraCaptureButton({ onCapture, disabled = false }: CameraCaptureButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (disabled || isCapturing) return;

    setIsCapturing(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Call capture
    await onCapture();

    setTimeout(() => setIsCapturing(false), 500);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 35,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer Ring */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            border: '4px solid rgba(255, 255, 255, 0.4)',
            position: 'absolute',
            pointerEvents: 'none',
          }}
        />

        {/* Inner Shutter Button */}
        <button
          onClick={handleCapture}
          disabled={disabled || isCapturing}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'white',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isCapturing ? 'scale(0.85)' : 'scale(1)',
            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
            opacity: disabled ? 0.6 : 1,
          }}
        />

        {/* Helper Text (Only active when valid) */}
        {!disabled && !isCapturing && (
          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              fontFamily: 'Inter',
              animation: 'fadeIn 0.5s ease-out'
            }}
          >
            Tap to capture
          </div>
        )}
      </div>

      {/* Shutter Flash */}
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
            transform: translateX(-50%) scale(1.05);
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

        button:hover:not(:disabled) {
          transform: translateX(-50%) scale(1.1);
        }

        button:active:not(:disabled) {
          transform: translateX(-50%) scale(0.95);
        }
      `}</style>
    </>
  );
}
