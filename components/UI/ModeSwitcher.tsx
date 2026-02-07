import React, { useEffect, useRef } from 'react';

interface ModeSwitcherProps {
  modes: string[];
  activeMode: string;
  onSelect: (mode: string) => void;
  disabled?: boolean;
}

export default function ModeSwitcher({ modes, activeMode, onSelect, disabled }: ModeSwitcherProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll to active item on change
  useEffect(() => {
    if (activeMode && itemRefs.current) {
      const index = modes.indexOf(activeMode);
      const item = itemRefs.current[index];
      if (item && containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;

        // Calculate center position
        const scrollLeft = itemLeft - (containerWidth / 2) + (itemWidth / 2);

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeMode, modes]);

  return (
    <div className="relative w-full overflow-hidden h-12 flex items-center">
      {/* Selection Indicator (Center Line/Dot - Optional, relying on text opacity for now) */}

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="
            flex items-center gap-6 overflow-x-auto px-[50%] 
            [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
            snap-x snap-mandatory
        "
      >
        {modes.map((mode, i) => {
          const isActive = mode === activeMode;
          return (
            <button
              key={mode}
              ref={(el) => { itemRefs.current[i] = el; }} // No return value needed
              onClick={() => !disabled && onSelect(mode)}
              disabled={disabled}
              className={`
                snap-center shrink-0 transition-all duration-300 ease-out
                ${isActive
                  ? 'text-white font-bold text-base scale-110 shadow-black drop-shadow-md'
                  : 'text-white/50 font-medium text-sm hover:text-white/80'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Fade Gradients */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/80 to-transparent" />
    </div>
  );
}
