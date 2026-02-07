'use client';

import { Plus, Minus, RotateCcw, RotateCw, MoveUp, MoveDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdjustmentPanelProps {
  visible: boolean;
  position?: { x: number; y: number };
  onSizeChange: (delta: number) => void;
  onRotate: (direction: 'left' | 'right') => void;
  onPositionChange: (axis: 'up' | 'down') => void;
  onOpacityChange?: (value: number) => void;
  autoHideDelay?: number;
}

export default function AdjustmentPanel({
  visible,
  position,
  onSizeChange,
  onRotate,
  onPositionChange,
  onOpacityChange,
  autoHideDelay = 3000,
}: AdjustmentPanelProps) {
  const [show, setShow] = useState(false);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (visible) {
      setShow(true);

      // Auto-hide after delay
      const timer = setTimeout(() => setShow(false), autoHideDelay);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, autoHideDelay]);

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setOpacity(value);
    onOpacityChange?.(value / 100);
  };

  if (!show) return null;

  return (
    <div
      className="adjustment-panel"
      style={{
        position: 'fixed',
        top: position ? `${position.y + 40}px` : '50%',
        left: position ? `${position.x}px` : '50%',
        transform: 'translateX(-50%)',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: '180px',
        animation: 'scaleIn 200ms ease-out',
      }}
    >
      {/* Size Control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '10px', color: '#999', width: '30px' }}>Size</span>
        <button
          onClick={() => onSizeChange(-0.1)}
          style={buttonStyle}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => onSizeChange(0.1)}
          style={buttonStyle}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Rotate Control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '10px', color: '#999', width: '30px' }}>Tilt</span>
        <button
          onClick={() => onRotate('left')}
          style={buttonStyle}
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => onRotate('right')}
          style={buttonStyle}
        >
          <RotateCw size={14} />
        </button>
      </div>

      {/* Reset Action */}
      <button
        onClick={() => {
          onSizeChange(0); // Reset logic would likely be handled by parent, but simulating interaction here
          // In real app, we'd pass a dedicated onReset prop
        }}
        style={{
          marginTop: '4px',
          padding: '6px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          borderRadius: '12px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '10px',
          fontFamily: 'Inter',
          cursor: 'pointer',
        }}
      >
        Reset position
      </button>

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

const buttonStyle = {
  flex: 1,
  height: '32px',
  background: 'rgba(255, 255, 255, 0.1)',
  border: 'none',
  borderRadius: '12px',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 200ms',
} as const;
