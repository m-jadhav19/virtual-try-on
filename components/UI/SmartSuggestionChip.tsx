'use client';

import { useEffect, useState } from 'react';

type Category = 'necklace' | 'earrings' | 'glasses' | 'hat' | 'ring' | 'watch';

interface SmartSuggestionChipProps {
  icon: string;
  message: string;
  category: Category;
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function SmartSuggestionChip({
  icon,
  message,
  category,
  visible,
  onAccept,
  onDismiss,
}: SmartSuggestionChipProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onDismiss]);

  if (!show) return null;

  return (
    <div
      className={`suggestion-chip ${show ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        bottom: '160px', // Above category navigation
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        padding: '12px 16px',
        background: 'rgba(0, 240, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'Inter, -apple-system, sans-serif',
        zIndex: 40,
        opacity: 0,
        transition: 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
      onClick={onAccept}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span>{message}</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setShow(false);
          onDismiss();
        }}
        style={{
          marginLeft: '8px',
          padding: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '50%',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          fontSize: '12px',
        }}
      >
        ×
      </button>

      <style jsx>{`
        .suggestion-chip.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .suggestion-chip:hover {
          background: rgba(0, 240, 255, 0.15);
          border-color: rgba(0, 240, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
