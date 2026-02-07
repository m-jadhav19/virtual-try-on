"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      orientation="horizontal"
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        "data-[orientation=horizontal]:h-8",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full",
          "data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5",
          "bg-[var(--vto-bg-secondary)] border border-[var(--vto-border-soft)]",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute rounded-full",
            "data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
            "bg-[var(--vto-accent-secondary)]/60",
            "transition-[width] duration-150 ease-out",
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "relative z-10 block shrink-0 rounded-full border-0 outline-none",
            "size-5 cursor-grab active:cursor-grabbing",
            "bg-[var(--vto-accent-secondary)]",
            "shadow-[0_0_0_2px_rgba(50,230,226,0.5),0_0_14px_var(--vto-glow-cyan)]",
            "transition-all duration-150 ease-out",
            "hover:scale-110 hover:shadow-[0_0_0_2px_rgba(50,230,226,0.6),0_0_20px_var(--vto-glow-cyan)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--vto-accent-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vto-bg-primary)]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
