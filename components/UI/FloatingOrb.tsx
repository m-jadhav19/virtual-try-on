'use client';

import { useEffect, useState, useRef } from 'react';

type Category = 'necklace' | 'earrings' | 'glasses' | 'hat' | 'ring' | 'watch';

interface FloatingOrbProps {
  category: Category;
  position: { x: number; y: number } | null;
  visible: boolean;
  onTap: () => void;
  autoHideDelay?: number; // ms before auto-hide
}

const CATEGORY_ICONS: Record<Category, string> = {
  necklace: '💎',
  earrings: '💍',
  glasses: '👓',
  hat: '🎩',
  ring: '💍',
  watch: '⌚',
};

const CATEGORY_OPTIONS: Record<Category, string[]> = {
  necklace: ['Size', 'Position', 'Rotation'],
  earrings: ['Size', 'Style'],
  glasses: ['Size', 'Tint'],
  hat: ['Size', 'Angle'],
  ring: ['Size', 'Fit'],
  watch: ['Size', 'Band'],
};

export default function FloatingOrb({
  category,
  position,
  visible,
  onTap,
  autoHideDelay = 3000,
}: FloatingOrbProps) {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && position) {
      setShow(true);

      // Auto-hide after delay
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        setShow(false);
        setExpanded(false);
      }, autoHideDelay);
    } else {
      setShow(false);
      setExpanded(false);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [visible, position, autoHideDelay]);

  const handleOrbClick = () => {
    setExpanded((prev) => !prev);
    onTap();

    // Reset auto-hide timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShow(false);
      setExpanded(false);
    }, autoHideDelay);
  };

  if (!position || !show) return null;

  return (
    <>
      {/* Main Orb */}
      <div
        className="floating-orb"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
        }}
        onClick={handleOrbClick}
      >
        <div
          className="orb-button"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {CATEGORY_ICONS[category]}
        </div>

        {/* Expanded Options */}
        {expanded && (
          <div
            className="orb-options"
            style={{
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '120px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'slideDown 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {CATEGORY_OPTIONS[category].map((option) => (
              <button
                key={option}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`${category} - ${option} clicked`);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .floating-orb {
          animation: orbPop 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes orbPop {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .orb-button:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.15);
        }

        .orb-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
}
