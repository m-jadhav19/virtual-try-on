'use client';

import { Glasses, Ear, Watch } from 'lucide-react';

type Category = 'necklace' | 'earrings' | 'glasses' | 'hat' | 'ring' | 'watch';
type TrackingMode = 'face' | 'hand';

interface CategoryConfig {
  id: Category;
  label: string;
  icon: React.ReactNode;
  trackingType: TrackingMode;
}

interface CategoryNavProps {
  currentCategory: Category;
  currentMode: TrackingMode;
  onCategoryChange: (category: Category) => void;
  disabled?: boolean;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'glasses', label: 'Glasses', icon: <Glasses size={24} />, trackingType: 'face' },
  { id: 'earrings', label: 'Earrings', icon: <Ear size={24} />, trackingType: 'face' },
  { id: 'necklace', label: 'Necklace', icon: '📿', trackingType: 'face' },
  { id: 'ring', label: 'Ring', icon: '💍', trackingType: 'hand' },
  { id: 'watch', label: 'Watch', icon: <Watch size={24} />, trackingType: 'hand' },
  { id: 'hat', label: 'Hat', icon: '🎩', trackingType: 'face' },
];

export default function CategoryNav({
  currentCategory,
  currentMode,
  onCategoryChange,
  disabled = false,
}: CategoryNavProps) {
  // Filter categories by current mode
  const filteredCategories = CATEGORIES.filter(
    (cat) => cat.trackingType === currentMode
  );

  const handleCategoryClick = (category: Category) => {
    if (disabled || category === currentCategory) return;
    onCategoryChange(category);
  };

  return (
    <div
      className="category-nav"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 30,
        maxWidth: '90%',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {filteredCategories.map((category) => {
        const isActive = category.id === currentCategory;

        return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            disabled={disabled}
            style={{
              minWidth: '80px',
              height: '72px',
              padding: '8px',
              background: isActive
                ? 'rgba(0, 240, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
              border: isActive
                ? '2px solid #00f0ff'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              color: 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: 'Inter, -apple-system, sans-serif',
              transition: 'all 250ms ease-out',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isActive
                ? '0 0 20px rgba(0, 240, 255, 0.4)'
                : 'none',
              opacity: disabled ? 0.5 : isActive ? 1 : 0.6,
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: typeof category.icon === 'string' ? '24px' : '20px' }}>
              {category.icon}
            </div>

            {/* Label */}
            <div style={{ fontSize: '11px', fontWeight: '500' }}>
              {category.label}
            </div>

            {/* Tracking type badge */}
            <div
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                opacity: 0.7,
              }}
            >
              {category.trackingType === 'face' ? 'Face' : 'Hand'}
            </div>
          </button>
        );
      })}

      <style jsx>{`
        .category-nav::-webkit-scrollbar {
          display: none;
        }

        .category-nav button:hover:not(:disabled) {
          background: rgba(0, 240, 255, 0.15);
          transform: scale(1.02);
        }

        .category-nav button:active:not(:disabled) {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

export { CATEGORIES };
export type { Category, CategoryConfig };
