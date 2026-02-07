'use client';

import { useState } from 'react';

type TrackingMode = 'face' | 'hand';

interface ModeToggleProps {
  currentMode: TrackingMode;
  onModeChange: (mode: TrackingMode) => void;
}

export default function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleModeChange = (mode: TrackingMode) => {
    if (mode === currentMode || isAnimating) return;

    setIsAnimating(true);
    onModeChange(mode);

    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div
      className="mode-toggle"
      style={{
        display: 'flex',
        gap: '8px',
        padding: '4px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Face Mode */}
      <button
        onClick={() => handleModeChange('face')}
        disabled={isAnimating}
        style={{
          flex: 1,
          padding: '10px 20px',
          background: currentMode === 'face'
            ? 'linear-gradient(135deg, #00f0ff, #00b8cc)'
            : 'transparent',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'Inter, -apple-system, sans-serif',
          cursor: isAnimating ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: currentMode === 'face'
            ? '0 0 20px rgba(0, 240, 255, 0.4)'
            : 'none',
          opacity: isAnimating ? 0.6 : 1,
        }}
      >
        <span>👤</span>
        <span>Face</span>
      </button>

      {/* Hand Mode */}
      <button
        onClick={() => handleModeChange('hand')}
        disabled={isAnimating}
        style={{
          flex: 1,
          padding: '10px 20px',
          background: currentMode === 'hand'
            ? 'linear-gradient(135deg, #00f0ff, #00b8cc)'
            : 'transparent',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'Inter, -apple-system, sans-serif',
          cursor: isAnimating ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: currentMode === 'hand'
            ? '0 0 20px rgba(0, 240, 255, 0.4)'
            : 'none',
          opacity: isAnimating ? 0.6 : 1,
        }}
      >
        <span>✋</span>
        <span>Hand</span>
      </button>
    </div>
  );
}
