"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCw, Move, ZoomIn, ArrowUpDown } from "lucide-react";
import { CategoryType } from "@/data/categories";

interface ControlSettings {
  scale: number;
  height: number;
  rotation: number;
  depth: number;
  finger?: string;
  wrist?: string;
  lockToLandmark: boolean;
  showAlignmentGuide: boolean;
}

interface EnhancedControlPanelProps {
  category: CategoryType;
  settings: ControlSettings;
  onSettingsChange: (settings: Partial<ControlSettings>) => void;
}

export function EnhancedControlPanel({ category, settings, onSettingsChange }: EnhancedControlPanelProps) {
  const isHandMode = category === "ring" || category === "watch";

  const labelClass = "text-sm font-medium text-white/[0.95]";
  const valueClass = "text-sm tabular-nums text-[var(--vto-accent-secondary)] font-medium min-w-[2.5rem] text-right";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg text-white mb-4">Fit Adjustments</h3>

        {isHandMode && (
          <div className="mb-6 space-y-4">
            {category === "ring" && (
              <div className="space-y-2">
                <Label className={labelClass}>Finger</Label>
                <Select
                  value={settings.finger || "ring"}
                  onValueChange={(value) => onSettingsChange({ finger: value })}
                >
                  <SelectTrigger className="vto-glass border-[var(--vto-border-soft)] text-white placeholder:text-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="vto-glass border-[var(--vto-border-soft)]">
                    <SelectItem value="thumb" className="text-white focus:bg-white/10 focus:text-white">Thumb</SelectItem>
                    <SelectItem value="index" className="text-white focus:bg-white/10 focus:text-white">Index</SelectItem>
                    <SelectItem value="middle" className="text-white focus:bg-white/10 focus:text-white">Middle</SelectItem>
                    <SelectItem value="ring" className="text-white focus:bg-white/10 focus:text-white">Ring</SelectItem>
                    <SelectItem value="pinky" className="text-white focus:bg-white/10 focus:text-white">Pinky</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {category === "watch" && (
              <div className="space-y-2">
                <Label className={labelClass}>Wrist</Label>
                <Select
                  value={settings.wrist || "left"}
                  onValueChange={(value) => onSettingsChange({ wrist: value })}
                >
                  <SelectTrigger className="vto-glass border-[var(--vto-border-soft)] text-white placeholder:text-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="vto-glass border-[var(--vto-border-soft)]">
                    <SelectItem value="left" className="text-white focus:bg-white/10 focus:text-white">Left Wrist</SelectItem>
                    <SelectItem value="right" className="text-white focus:bg-white/10 focus:text-white">Right Wrist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <ZoomIn className="size-4 text-[var(--vto-accent-secondary)] shrink-0" aria-hidden />
            <Label className={labelClass}>Scale</Label>
            <span className={valueClass}>{Math.round(settings.scale * 100)}%</span>
          </div>
          <Slider
            value={[settings.scale]}
            onValueChange={([v]) => onSettingsChange({ scale: v ?? settings.scale })}
            min={0.5}
            max={2}
            step={0.05}
            className="w-full"
          />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="size-4 text-[var(--vto-accent-secondary)] shrink-0" aria-hidden />
            <Label className={labelClass}>Height</Label>
            <span className={valueClass}>{settings.height}</span>
          </div>
          <Slider
            value={[settings.height]}
            onValueChange={([v]) => onSettingsChange({ height: v ?? settings.height })}
            min={-100}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <RotateCw className="size-4 text-[var(--vto-accent-secondary)] shrink-0" aria-hidden />
            <Label className={labelClass}>Rotation</Label>
            <span className={valueClass}>{settings.rotation}°</span>
          </div>
          <Slider
            value={[settings.rotation]}
            onValueChange={([v]) => onSettingsChange({ rotation: v ?? settings.rotation })}
            min={-180}
            max={180}
            step={5}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Move className="size-4 text-[var(--vto-accent-secondary)] shrink-0" aria-hidden />
            <Label className={labelClass}>Depth</Label>
            <span className={valueClass}>{settings.depth}</span>
          </div>
          <Slider
            value={[settings.depth]}
            onValueChange={([v]) => onSettingsChange({ depth: v ?? settings.depth })}
            min={-50}
            max={50}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--vto-border-soft)]">
        <h4 className="font-medium text-sm text-white/[0.95] mb-3">Advanced</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              id="lockLandmark"
              checked={settings.lockToLandmark}
              onCheckedChange={(checked) =>
                onSettingsChange({ lockToLandmark: checked === true })
              }
              className="border-white/30 data-[state=checked]:bg-[var(--vto-accent-secondary)] data-[state=checked]:border-[var(--vto-accent-secondary)]"
            />
            <span className="text-sm text-white/80 group-hover:text-white/95 transition-colors">Lock to landmark</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              id="showGuide"
              checked={settings.showAlignmentGuide}
              onCheckedChange={(checked) =>
                onSettingsChange({ showAlignmentGuide: checked === true })
              }
              className="border-white/30 data-[state=checked]:bg-[var(--vto-accent-primary)] data-[state=checked]:border-[var(--vto-accent-primary)]"
            />
            <span className="text-sm text-white/80 group-hover:text-white/95 transition-colors">Show alignment guide</span>
          </label>
        </div>
      </div>
    </div>
  );
}
