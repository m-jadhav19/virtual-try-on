'use client';

import { useRef, useState } from 'react';

interface Product {
  id: string;
  name: string;
  thumbnail: string;
}

interface ProductTrayProps {
  products: Product[];
  activeProductId: string;
  onProductSelect: (productId: string) => void;
  onHide?: () => void;
  disabled?: boolean;
}

export default function ProductTray({
  products,
  activeProductId,
  onProductSelect,
  onHide,
  disabled = false,
}: ProductTrayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [previewProduct, setPreviewProduct] = useState<string | null>(null);

  const handleProductClick = (productId: string) => {
    if (disabled || productId === activeProductId) return;

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Play snap sound (optional)
    // new Audio('/sounds/snap.mp3').play();

    onProductSelect(productId);
  };

  const handleLongPressStart = (productId: string) => {
    const timer = setTimeout(() => {
      setPreviewProduct(productId);
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setPreviewProduct(null);
  };

  const handleSwipeDown = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;

    const handleMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      if (currentY - startY > 50) {
        onHide?.();
        document.removeEventListener('touchmove', handleMove);
      }
    };

    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleMove);
    }, { once: true });
  };

  return (
    <div
      ref={scrollRef}
      onTouchStart={handleSwipeDown}
      style={{
        position: 'fixed',
        bottom: '120px',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px 24px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        zIndex: 25,
        scrollSnapType: 'x mandatory',
      }}
      className="product-tray"
    >
      {products.map((product) => {
        const isActive = product.id === activeProductId;

        return (
          <button
            key={product.id}
            onClick={() => handleProductClick(product.id)}
            disabled={disabled}
            style={{
              minWidth: '80px',
              height: '80px',
              padding: 0,
              flexShrink: 0,
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              overflow: 'hidden',
              transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like
              transform: isActive ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
              boxShadow: isActive
                ? '0 10px 20px -5px rgba(0, 0, 0, 0.4), 0 0 0 3px white'
                : 'none',
              scrollSnapAlign: 'center',
              border: 'none',
              opacity: disabled ? 0.6 : isActive ? 1 : 0.8,
            }}
          >
            <img
              src={product.thumbnail}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isActive ? 'none' : 'brightness(0.8)',
                transition: 'filter 300ms',
              }}
            />

            {/* Active Glow Overlay */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.3)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </button>
        );
      })}

      <style jsx>{`
        .product-tray::-webkit-scrollbar {
          display: none;
        }
        
        .product-tray button:active:not(:disabled) {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

export type { Product };
