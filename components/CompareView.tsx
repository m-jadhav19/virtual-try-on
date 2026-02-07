"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Slider } from "@/components/ui/slider";

interface CompareViewProps {
  beforeImage: string;
  afterImage: string;
}

export function CompareView({ beforeImage, afterImage }: CompareViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      {/* Before Image (Full) */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt="Before"
          className="w-full h-full object-contain"
        />
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-1 h-6 bg-gray-600 rounded-full" />
            <div className="w-1 h-6 bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <span className="text-white text-sm font-medium">Before</span>
      </div>
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <span className="text-white text-sm font-medium">After</span>
      </div>

      {/* Slider Control */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64">
        <Slider
          value={[sliderPosition]}
          onValueChange={([value]) => setSliderPosition(value)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
}
