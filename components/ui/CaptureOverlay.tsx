'use client';

import { useEffect, useState } from 'react';

interface CaptureOverlayProps {
  visible: boolean;
  capturedImage: string | null;
  onSave: () => void;
  onCompare: () => void;
  onShare: () => void;
  onDismiss: () => void;
}

export default function CaptureOverlay({
  visible,
  capturedImage,
  onSave,
  onCompare,
  onShare,
  onDismiss,
}: CaptureOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div
      className={`capture-overlay ${visible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 300ms ease',
      }}
      onClick={onDismiss}
    >
      {/* Captured Image */}
      {capturedImage && (
        <div
          className="captured-image-container"
          style={{
            maxWidth: '90%',
            maxHeight: '70%',
            marginBottom: '32px',
            animation: 'freezeFrame 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <img
            src={capturedImage}
            alt="Captured"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)',
            }}
          />
        </div>
      )}

      {/* Action Tray */}
      <div
        className="action-tray"
        style={{
          display: 'flex',
          gap: '16px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideUp 350ms cubic-bezier(0.4, 0, 0.2, 1) 200ms backwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Save */}
        <button
          onClick={onSave}
          className="action-button"
          style={{
            padding: '12px 24px',
            background: 'rgba(0, 240, 255, 0.2)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />
          </svg>
          Save
        </button>

        {/* Compare */}
        <button
          onClick={onCompare}
          className="action-button"
          style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z" />
          </svg>
          Compare
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          className="action-button"
          style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
          </svg>
          Share
        </button>
      </div>

      <style jsx>{`
        .capture-overlay.visible {
          opacity: 1;
        }

        @keyframes freezeFrame {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .action-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
