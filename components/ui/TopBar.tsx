'use client';

import { useMemo } from 'react';

type TrackingStatus = 'detected' | 'searching' | 'lost';
type TrackingMode = 'face' | 'hand';

interface TopBarProps {
  trackingStatus: TrackingStatus;
  trackingMode: TrackingMode;
}

export default function TopBar({ trackingStatus, trackingMode }: TopBarProps) {
  const statusConfig = useMemo(() => {
    switch (trackingStatus) {
      case 'detected':
        return {
          color: '#00ff88',
          icon: '🟢',
          text: `${trackingMode === 'face' ? 'Face' : 'Hand'} detected`,
        };
      case 'searching':
        return {
          color: '#ffc107',
          icon: '🟡',
          text: 'Searching',
        };
      case 'lost':
        return {
          color: '#ff5252',
          icon: '🔴',
          text: 'Tracking lost',
        };
    }
  }, [trackingStatus, trackingMode]);

  return (
    <div
      className="top-bar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* App Title */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: '500',
          color: 'white',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        Virtual Try-On
      </div>

      {/* Live Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        <div
          className="live-dot"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ff5252',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        Live
      </div>

      {/* Tracking Status Chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: `1px solid ${statusConfig.color}40`,
          fontSize: '13px',
          fontWeight: '500',
          color: 'white',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        <span>{statusConfig.icon}</span>
        <span>{statusConfig.text}</span>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
