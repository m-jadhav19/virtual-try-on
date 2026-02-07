'use client';

import { useEffect, useState } from 'react';

type Category = 'necklace' | 'earrings' | 'glasses' | 'hat' | 'ring' | 'watch';

interface CategoryLabelProps {
  category: Category;
  visible: boolean;
  autoFadeDuration?: number; // ms before auto-fade
}

const CATEGORY_LABELS: Record<Category, string> = {
  necklace: 'Necklace',
  earrings: 'Earrings',
  glasses: 'Glasses',
  hat: 'Hat',
  ring: 'Ring',
  watch: 'Watch',
};

export default function CategoryLabel({
  category,
  visible,
  autoFadeDuration = 1000
}: CategoryLabelProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);

      // Auto-fade after duration
      const timer = setTimeout(() => {
        setShow(false);
      }, autoFadeDuration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, category, autoFadeDuration]);

  return (
    <div
      className={`category-label ${show ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '12px 24px',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '9999px',
        color: 'white',
        fontSize: '1.25rem',
        fontWeight: '500',
        fontFamily: 'Inter, -apple-system, sans-serif',
        pointerEvents: 'none',
        zIndex: 100,
        opacity: 0,
        transition: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {CATEGORY_LABELS[category]}

      <style jsx>{`
        .category-label.visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
