'use client';

import { useMemo } from 'react';

interface MinimalTopBarProps {
  isLive: boolean;
  trackingStatus: 'detected' | 'searching' | 'lost';
}

export default function MinimalTopBar({ isLive, trackingStatus }: MinimalTopBarProps) {
  const statusConfig = useMemo(() => {
    if (!isLive) return { color: '#ff5252', text: 'Offline' };

    switch (trackingStatus) {
      case 'detected':
        return { color: '#00ff88', text: 'Live' };
      case 'searching':
        return { color: '#ffc107', text: 'Searching...' };
      case 'lost':
        return { color: '#ff5252', text: 'Tracking Lost' };
    }
  }, [isLive, trackingStatus]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 20px',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transition: 'all 300ms ease-out',
        }}
      >
        {/* Status Dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: statusConfig.color,
            boxShadow: `0 0 8px ${statusConfig.color}`,
            animation: trackingStatus === 'searching' ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        />

        {/* Status Text */}
        <span
          style={{
            fontSize: '13px',
            fontWeight: '500',
            color: 'white',
            fontFamily: 'Inter, -apple-system, sans-serif',
            letterSpacing: '0.3px',
            opacity: 0.9,
          }}
        >
          {statusConfig.text}
        </span>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
