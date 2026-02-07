'use client';

import { useEffect, useState } from 'react';

interface FeedbackToastProps {
  message: string;
  type?: 'success' | 'info';
  visible: boolean;
  onHidden?: () => void;
}

export default function FeedbackToast({
  message,
  type = 'info',
  visible,
  onHidden
}: FeedbackToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onHidden?.();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onHidden]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px', // Below top bar
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#000',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'Inter',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 90,
        opacity: show ? 1 : 0,
        translate: show ? '0 0' : '0 -10px',
        transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
      }}
    >
      <span>{type === 'success' ? '✨' : 'ℹ️'}</span>
      <span>{message}</span>
    </div>
  );
}
