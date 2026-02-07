'use client';

import { useEffect, useState } from 'react';

interface SwitchingToastProps {
  message: string;
  visible: boolean;
  duration?: number;
}

export default function SwitchingToast({
  message,
  visible,
  duration = 1500
}: SwitchingToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration]);

  if (!show) return null;

  return (
    <div
      className={`switching-toast ${show ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        top: '70px', // Below top bar
        left: '50%',
        transform: 'translateX(-50%) translateY(-20px)',
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: 'Inter, -apple-system, sans-serif',
        zIndex: 90,
        opacity: 0,
        transition: 'all 200ms ease-out',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {message}

      <style jsx>{`
        .switching-toast.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
    </div>
  );
}
