'use client';

import { Glasses, Sparkles, Orbit, CircleDot, Watch, Crown } from 'lucide-react';
import { type Category } from '../TryOnCanvas';

export { type Category };

interface TypeCarouselProps {
  activeType: Category;
  onTypeChange: (type: Category) => void;
  disabled?: boolean;
}

export interface TypeItem {
  id: Category;
  icon: React.ReactNode;
  label: string;
}

export const TYPES: TypeItem[] = [
  { id: 'glasses', icon: <Glasses size={32} strokeWidth={1.5} />, label: 'Glasses' },
  { id: 'earrings', icon: <Sparkles size={32} strokeWidth={1.5} />, label: 'Earrings' },
  { id: 'necklace', icon: <Orbit size={32} strokeWidth={1.5} />, label: 'Necklace' },
  { id: 'ring', icon: <CircleDot size={32} strokeWidth={1.5} />, label: 'Ring' },
  { id: 'watch', icon: <Watch size={32} strokeWidth={1.5} />, label: 'Watch' },
  { id: 'hat', icon: <Crown size={32} strokeWidth={1.5} />, label: 'Hat' },
];

export default function TypeCarousel({ activeType, onTypeChange, disabled }: TypeCarouselProps) {
  const handleTypeClick = (typeId: Category) => {
    if (!disabled && typeId !== activeType) {
      // Haptic feedback if available (mobile)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onTypeChange(typeId);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 calc(50% - 40px)', // Centers the start
        gap: '4px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        zIndex: 30,
        scrollSnapType: 'x mandatory',
        pointerEvents: disabled ? 'none' : 'auto',
        maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
      }}
      className="type-carousel"
    >
      {/* Selection Ring (Center Overlay) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
          zIndex: -1, // Behind icons but visible
          opacity: 0.8,
        }}
      />

      {TYPES.map((type) => {
        const isActive = type.id === activeType;

        return (
          <button
            key={type.id}
            onClick={() => handleTypeClick(type.id)}
            disabled={disabled}
            style={{
              minWidth: '70px',
              height: '80px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transform: isActive ? 'scale(1.1)' : 'scale(0.8)',
              opacity: isActive ? 1 : 0.5,
              transition: 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              scrollSnapAlign: 'center',
              color: 'white', // Ensure icon color is white
            }}
          >
            {/* Icon Circle */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: isActive ? '0 0 20px rgba(0, 240, 255, 0.4)' : 'none',
                transition: 'all 300ms',
              }}
            >
              {type.icon}
            </div>

            {/* Label (Only show active) */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: '500',
                color: 'white',
                fontFamily: 'Inter',
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'all 300ms',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              {type.label}
            </div>
          </button>
        );
      })}

      <style jsx>{`
        .type-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
