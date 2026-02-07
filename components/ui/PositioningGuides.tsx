'use client';

import { useEffect, useState } from 'react';

type GuideType = 'face-oval' | 'ear-dots' | 'neck-curve' | 'hand-skeleton';

interface PositioningGuidesProps {
  type: GuideType;
  visible: boolean;
  isLocked?: boolean;
  message?: string;
}

export default function PositioningGuides({
  type,
  visible,
  isLocked = false,
  message,
}: PositioningGuidesProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible && !isLocked) {
      setShow(true);
    } else if (isLocked) {
      // Fade out after lock with delay
      const timer = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, isLocked]);

  if (!show) return null;

  return (
    <div
      className="positioning-guides"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        opacity: show ? (isLocked ? 0.3 : 0.6) : 0,
        transition: 'opacity 300ms ease-in-out',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: 'drop-shadow(0 0 4px rgba(0, 240, 255, 0.5))' }}
      >
        {/* Face Oval & Features */}
        {type === 'face-oval' && (
          <g stroke="#00f0ff" strokeWidth="0.5" fill="none" opacity="0.8">
            {/* Main Face Oval */}
            <ellipse cx="50" cy="45" rx="22" ry="30" strokeOpacity="0.8" />

            {/* Eye Line (Dotted) */}
            <path d="M 35 40 L 65 40" strokeDasharray="1,2" strokeOpacity="0.5" />

            {/* Nose Line (Vertical Dotted) */}
            <path d="M 50 40 L 50 52" strokeDasharray="1,2" strokeOpacity="0.5" />

            {/* Chin Marker */}
            <path d="M 45 75 Q 50 78 55 75" opacity="0.4" />
          </g>
        )}

        {/* Ear Dots with Pulse */}
        {type === 'ear-dots' && (
          <>
            <circle cx="25" cy="40" r="1.5" fill="#00f0ff" opacity="0.6">
              <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="75" cy="40" r="1.5" fill="#00f0ff" opacity="0.6">
              <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <path d="M 25 40 Q 50 45 75 40" stroke="#00f0ff" strokeWidth="0.2" fill="none" opacity="0.3" strokeDasharray="2,2" />
          </>
        )}

        {/* Neck Curve */}
        {type === 'neck-curve' && (
          <g>
            <path
              d="M 35 60 Q 50 70 65 60"
              stroke="#00f0ff"
              strokeWidth="0.5"
              strokeDasharray="2,3"
              fill="none"
              opacity="0.7"
            />
            {/* Center Drop Marker */}
            <circle cx="50" cy="65" r="1" fill="#00f0ff" opacity="0.5" />
          </g>
        )}

        {/* Hand Skeleton (Refined) */}
        {type === 'hand-skeleton' && (
          <g stroke="#00f0ff" strokeWidth="0.5" fill="none" opacity="0.7">
            {/* Wrist */}
            <path d="M 42 80 L 58 80" strokeOpacity="0.5" />

            {/* Palm Center */}
            <circle cx="50" cy="60" r="2" strokeDasharray="1,1" strokeOpacity="0.4" />

            {/* Finger Guides */}
            <path d="M 35 40 L 40 55" strokeDasharray="1,2" opacity="0.5" />
            <path d="M 45 35 L 48 52" strokeDasharray="1,2" opacity="0.6" />
            <path d="M 55 35 L 54 52" strokeDasharray="1,2" opacity="0.6" />
            <path d="M 65 40 L 60 55" strokeDasharray="1,2" opacity="0.5" />
          </g>
        )}
      </svg>

      {/* Contextual Message */}
      {message && (
        <div
          style={{
            position: 'absolute',
            bottom: '140px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            color: 'white',
            fontSize: '13px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            whiteSpace: 'nowrap',
            animation: 'slideUp 300ms ease-out',
          }}
        >
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export type { GuideType };
