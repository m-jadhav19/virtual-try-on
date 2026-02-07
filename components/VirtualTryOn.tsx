'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import TryOnCanvas, { type TryOnCanvasHandle, type TrackingStatus } from './TryOnCanvas';
import ScriptLoader from './ScriptLoader';
import MinimalTopBar from './UI/MinimalTopBar';
import TypeCarousel, { TYPES, type Category } from './UI/TypeCarousel';
import PositioningGuides, { type GuideType } from './UI/PositioningGuides';
import ProductTray, { type Product } from './UI/ProductTray';
import CameraCaptureButton from './UI/CameraCaptureButton';
import CaptureSheet from './UI/CaptureSheet';
import AdaptiveProduct from './AdaptiveProduct';
import FeedbackToast from './UI/FeedbackToast';
import AdjustmentPanel from './UI/AdjustmentPanel';
import { useAmbientLight } from './AmbientLightDetector';

// Mock products
const MOCK_PRODUCTS: Record<Category, Product[]> = {
  glasses: [
    { id: 'g1', name: 'Classic Black', thumbnail: 'https://via.placeholder.com/72?text=G1' },
    { id: 'g2', name: 'Aviator Gold', thumbnail: 'https://via.placeholder.com/72?text=G2' },
    { id: 'g3', name: 'Round Vintage', thumbnail: 'https://via.placeholder.com/72?text=G3' },
  ],
  earrings: [
    { id: 'e1', name: 'Pearl Studs', thumbnail: 'https://via.placeholder.com/72?text=E1' },
    { id: 'e2', name: 'Gold Hoops', thumbnail: 'https://via.placeholder.com/72?text=E2' },
  ],
  necklace: [
    { id: 'n1', name: 'Silver Chain', thumbnail: 'https://via.placeholder.com/72?text=N1' },
    { id: 'n2', name: 'Pearl Necklace', thumbnail: 'https://via.placeholder.com/72?text=N2' },
  ],
  ring: [
    { id: 'r1', name: 'Diamond Ring', thumbnail: 'https://via.placeholder.com/72?text=R1' },
    { id: 'r2', name: 'Gold Band', thumbnail: 'https://via.placeholder.com/72?text=R2' },
  ],
  watch: [
    { id: 'w1', name: 'Classic Watch', thumbnail: 'https://via.placeholder.com/72?text=W1' },
    { id: 'w2', name: 'Sport Watch', thumbnail: 'https://via.placeholder.com/72?text=W2' },
  ],
  hat: [
    { id: 'h1', name: 'Fedora', thumbnail: 'https://via.placeholder.com/72?text=H1' },
    { id: 'h2', name: 'Baseball Cap', thumbnail: 'https://via.placeholder.com/72?text=H2' },
  ],
};

// Camera framing transforms per type
const CAMERA_TRANSFORMS: Record<Category, string> = {
  glasses: 'scale(1.3)',
  earrings: 'scale(1.2)',
  necklace: 'scale(1.0) translateY(-10%)',
  ring: 'scale(1.5)',
  watch: 'scale(1.4) rotate(-5deg)',
  hat: 'scale(1.1) translateY(5%)',
};

// Guide types per category
const GUIDE_TYPES: Record<Category, GuideType> = {
  glasses: 'face-oval',
  earrings: 'ear-dots',
  necklace: 'neck-curve',
  ring: 'hand-skeleton',
  watch: 'hand-skeleton',
  hat: 'face-oval',
};

export default function VirtualTryOn() {
  // Core state
  const [activeType, setActiveType] = useState<Category>('glasses');
  const [activeProductId, setActiveProductId] = useState('g1');
  const [status, setStatus] = useState<TrackingStatus>('loading');
  const [statusText, setStatusText] = useState('Initializing...');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // UI state
  const [showGuides, setShowGuides] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [guideMessage, setGuideMessage] = useState<string | undefined>();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCaptureSheet, setShowCaptureSheet] = useState(false);

  // Adjustment state
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustments, setAdjustments] = useState({ size: 1, rotation: 0, y: 0 });

  // Tracking state
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [headRotation, setHeadRotation] = useState({ x: 0, y: 0, z: 0 });
  const [handMovement, setHandMovement] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<TryOnCanvasHandle | null>(null);
  const ambientLight = useAmbientLight(videoElement, 500);

  // Get current products
  const currentProducts = MOCK_PRODUCTS[activeType];

  // Capture video element
  useEffect(() => {
    const findVideoElement = () => {
      const video = document.querySelector('video');
      if (video) setVideoElement(video);
    };
    findVideoElement();
    const timer = setTimeout(findVideoElement, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle status updates
  const handleStatusChange = useCallback((newStatus: TrackingStatus, text: string) => {
    setStatus(newStatus);
    setStatusText(text);

    if (newStatus === 'tracking') {
      setIsLocked(true);
      setShowGuides(true);
      setGuideMessage('Perfect! ✨');

      // Hide message after delay
      setTimeout(() => setGuideMessage(undefined), 2000);
    } else if (newStatus === 'searching') {
      setIsLocked(false);
      setShowGuides(true);
      setGuideMessage('Align your face');
    } else {
      setIsLocked(false);
      setShowGuides(true);
      setGuideMessage('Show your hand');
    }
  }, []);

  // Handle errors
  const handleError = useCallback((e: Error) => {
    setStatus('error');
    setStatusText(e.message || 'Error');
  }, []);

  // Type change handler
  const handleTypeChange = useCallback((newType: Category) => {
    if (newType === activeType || isTransitioning) return;

    setIsTransitioning(true);
    setActiveType(newType);
    setActiveProductId(MOCK_PRODUCTS[newType][0].id);
    setIsLocked(false);
    setShowGuides(true);

    // Camera reframe happens via CSS transform
    setTimeout(() => setIsTransitioning(false), 500);
  }, [activeType, isTransitioning]);

  // Product selection
  const handleProductSelect = useCallback((productId: string) => {
    setActiveProductId(productId);
  }, []);

  // Capture handler
  const handleCapture = useCallback(async () => {
    try {
      const imageData = await canvasRef.current?.capture();
      if (imageData) {
        setCapturedImage(imageData);
        setShowCaptureSheet(true);
      }
    } catch (err) {
      console.error('Capture failed:', err);
    }
  }, []);

  // Capture sheet handlers
  const handleSave = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `aura-try-${Date.now()}.png`;
      link.click();
    }
    setShowCaptureSheet(false);
  }, [capturedImage]);

  const handleShare = useCallback(async () => {
    if (capturedImage && navigator.share) {
      try {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const file = new File([blob], 'aura-try.png', { type: 'image/png' });
        await navigator.share({ files: [file], title: 'AuraTry' });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
    setShowCaptureSheet(false);
  }, [capturedImage]);

  const handleCompare = useCallback(() => {
    console.log('Compare mode - TODO');
    setShowCaptureSheet(false);
  }, []);

  const handleRetake = useCallback(() => {
    setShowCaptureSheet(false);
  }, []);

  // Animation update handler
  const handleAnimationUpdate = useCallback((params: any) => {
    // In real implementation, update 3D model
  }, []);

  // Map tracking status
  const trackingStatus = useMemo(() => {
    if (status === 'tracking') return 'detected';
    if (status === 'searching') return 'searching';
    return 'lost';
  }, [status]);

  return (
    <div className="relative w-full h-[100svh] bg-black overflow-hidden">
      <ScriptLoader />

      {/* Camera Canvas with Visual Enhancements */}
      <div
        className="absolute inset-0 z-0 bg-black"
        style={{
          transform: CAMERA_TRANSFORMS[activeType],
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            filter: 'brightness(1.1) contrast(1.05) saturate(1.1)', // Enhance camera feed
          }}
        >
          <TryOnCanvas
            ref={canvasRef}
            category={activeType}
            onStatusChange={handleStatusChange}
            onError={handleError}
          />
        </div>

        {/* Cinematographic Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

      {/* Adaptive Product Animations */}
      <AdaptiveProduct
        category={activeType}
        headRotation={headRotation}
        handMovement={handMovement}
        ambientLight={ambientLight}
        onAnimationUpdate={handleAnimationUpdate}
      />

      {/* Minimal Top Bar - Fixed Z-Index */}
      <MinimalTopBar
        isLive={status !== 'error'}
        trackingStatus={trackingStatus}
      />

      {/* Feedback Toast */}
      <FeedbackToast
        message={guideMessage || ''}
        visible={!!guideMessage}
        type={status === 'tracking' ? 'success' : 'info'}
      />

      {/* Interaction Layer (Tap to Edit) */}
      <div
        className="absolute inset-0 z-10"
        onClick={() => {
          if (status === 'tracking') {
            setShowAdjustment(!showAdjustment);
            // Auto-hide after 5s inactivity
            if (!showAdjustment) {
              setTimeout(() => setShowAdjustment(false), 5000);
            }
          }
        }}
      />

      {/* Adjustment Panel */}
      {showAdjustment && (
        <AdjustmentPanel
          visible={showAdjustment}
          position={{ x: window.innerWidth / 2, y: window.innerHeight / 2 + 100 }}
          onSizeChange={(delta) => setAdjustments(prev => ({ ...prev, size: prev.size + delta }))}
          onRotate={(dir) => setAdjustments(prev => ({ ...prev, rotation: prev.rotation + (dir === 'left' ? -5 : 5) }))}
          onPositionChange={(dir) => setAdjustments(prev => ({ ...prev, y: prev.y + (dir === 'up' ? -5 : 5) }))}
        />
      )}

      {/* Positioning Guides */}
      {!showCaptureSheet && (
        <div className="pointer-events-none z-20 absolute inset-0">
          <PositioningGuides
            type={GUIDE_TYPES[activeType]}
            visible={showGuides}
            isLocked={isLocked}
            message={undefined} // Handled by Toast now
          />
        </div>
      )}

      {/* Product Tray */}
      {!showCaptureSheet && !showAdjustment && currentProducts.length > 0 && (
        <ProductTray
          products={currentProducts}
          activeProductId={activeProductId}
          onProductSelect={handleProductSelect}
          disabled={isTransitioning}
        />
      )}

      {/* Capture Button */}
      {!showCaptureSheet && !showAdjustment && (
        <CameraCaptureButton
          onCapture={handleCapture}
          disabled={status !== 'tracking' || isTransitioning}
        />
      )}

      {/* Type Carousel */}
      {!showCaptureSheet && (
        <TypeCarousel
          activeType={activeType}
          onTypeChange={handleTypeChange}
          disabled={isTransitioning}
        />
      )}

      {/* Capture Sheet */}
      <CaptureSheet
        visible={showCaptureSheet}
        capturedImage={capturedImage}
        onSave={handleSave}
        onShare={handleShare}
        onCompare={handleCompare}
        onRetake={handleRetake}
        onDismiss={handleRetake}
      />

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #000;
        }
      `}</style>
    </div>
  );
}
