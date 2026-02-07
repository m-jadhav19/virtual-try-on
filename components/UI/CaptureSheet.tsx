'use client';

import { useEffect, useState } from 'react';
import { Save, Share2, ArrowLeftRight, RotateCcw } from 'lucide-react';

interface CaptureSheetProps {
  visible: boolean;
  capturedImage: string | null;
  onSave: () => void;
  onShare: () => void;
  onCompare: () => void;
  onRetake: () => void;
  onDismiss: () => void;
}

export default function CaptureSheet({
  visible,
  capturedImage,
  onSave,
  onShare,
  onCompare,
  onRetake,
  onDismiss,
}: CaptureSheetProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}
    >
      {/* Captured Image */}
      {capturedImage && (
        <div
          style={{
            maxWidth: '90%',
            maxHeight: '70%',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)',
            animation: 'freezeFrame 500ms ease-out',
          }}
        >
          <img
            src={capturedImage}
            alt="Captured"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      {/* Action Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px 24px 0 0',
          animation: 'slideUp 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55) 200ms both',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}
        >
          {/* Save */}
          <button
            onClick={onSave}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            <Save size={24} />
            <span style={{ fontSize: '12px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Save
            </span>
          </button>

          {/* Share */}
          <button
            onClick={onShare}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            <Share2 size={24} />
            <span style={{ fontSize: '12px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Share
            </span>
          </button>

          {/* Compare */}
          <button
            onClick={onCompare}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            <ArrowLeftRight size={24} />
            <span style={{ fontSize: '12px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Compare
            </span>
          </button>

          {/* Retake */}
          <button
            onClick={onRetake}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            <RotateCcw size={24} />
            <span style={{ fontSize: '12px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Retake
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes freezeFrame {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        button:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          transform: scale(1.05);
        }

        button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
