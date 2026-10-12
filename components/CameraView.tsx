"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import TryOnCanvas, { type TryOnCanvasHandle, type Category, type ModelConfig, type TrackingStatus } from "./TryOnCanvas";
import ScriptLoader from "./ScriptLoader";

export interface CameraViewControls {
  scale?: number;
  height?: number;
  rotation?: number;
  depth?: number;
}

interface CameraViewProps {
  onCapture?: (imageData: string) => void;
  activeCategory?: Category;
  controls?: CameraViewControls;
  /** Selected product from vto-products (model paths + hand overrides) */
  modelConfig?: ModelConfig | null;
  onStatusChange?: (status: TrackingStatus, text: string) => void;
}

export type CameraViewHandle = {
  capture: () => Promise<string | void>;
  flipCamera: () => Promise<void>;
};

export const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(
  function CameraView({ onCapture, activeCategory = "glasses", controls, modelConfig, onStatusChange }, ref) {
    const canvasRef = useRef<TryOnCanvasHandle | null>(null);

    // Expose capture method via ref
    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (canvasRef.current) {
          const imageData = await canvasRef.current.capture();
          if (imageData && onCapture) {
            onCapture(imageData);
          }
          return imageData;
        }
      },
      flipCamera: async () => {
        await canvasRef.current?.flipCamera();
      },
    }), [onCapture]);

    // Store capture handler on window for TryOnPage to access (fallback)
    useEffect(() => {
      const handleCapture = async () => {
        if (canvasRef.current) {
          const imageData = await canvasRef.current.capture();
          if (imageData && onCapture) {
            onCapture(imageData);
          }
        }
      };
      (window as any).__cameraViewCapture = handleCapture;
      return () => {
        delete (window as any).__cameraViewCapture;
      };
    }, [onCapture]);

    return (
      <div className="absolute inset-0 bg-black">
        <ScriptLoader />
        <TryOnCanvas
          ref={canvasRef}
          category={activeCategory}
          transformOverrides={controls}
          modelConfig={modelConfig}
          onError={(e) => console.error("TryOnCanvas error:", e)}
          onStatusChange={onStatusChange}
        />
      </div>
    );
  }
);
