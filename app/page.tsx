"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import {
  categories,
  CategoryType,
  getCategoryById,
  getVtoCategoryById,
  getVtoProduct,
  getDefaultProductId,
  type VtoProduct,
} from "@/data/categories";
import { CameraView, type CameraViewHandle } from "@/components/CameraView";
import type { TrackingStatus as LiveTrackingStatus } from "@/components/TryOnCanvas";
import { GestureHints } from "@/components/GestureHints";
import { CompareView } from "@/components/CompareView";
import { Camera, RotateCcw, Heart, X, Download, Share2, ArrowLeftRight, SwitchCamera, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

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

const defaultSettings: ControlSettings = {
  scale: 1,
  height: 0,
  rotation: 0,
  depth: 0,
  finger: "ring",
  wrist: "left",
  lockToLandmark: false,
  showAlignmentGuide: false,
};

const RAIL_LABEL: Record<CategoryType, string> = {
  glasses: "GLAS",
  earrings: "EARR",
  necklace: "NECK",
  ring: "RING",
  watch: "WATCH",
  hat: "HAT",
};

const STRAPS = ["#1f2937", "#a16207", "#9ca3af", "#be123c"];
const FIT_SCALES = [0.85, 1, 1.15];
const FIT_LABELS = ["S", "M", "L"];

function DeskIcon({ id }: { id: CategoryType }) {
  const props = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
    "aria-hidden": true as const,
  };
  switch (id) {
    case "glasses":
      return (
        <svg {...props}>
          <rect x="2" y="9" width="8" height="6" />
          <rect x="14" y="9" width="8" height="6" />
          <path d="M10 12h4" />
        </svg>
      );
    case "earrings":
      return (
        <svg {...props}>
          <circle cx="12" cy="16" r="4" />
          <path d="M12 3v9" />
        </svg>
      );
    case "necklace":
      return (
        <svg {...props}>
          <path d="M4 5c0 8 3 13 8 13s8-5 8-13" />
        </svg>
      );
    case "ring":
      return (
        <svg {...props}>
          <circle cx="12" cy="15" r="5" />
          <path d="M9 7.5l3-4 3 4-3 1.5z" />
        </svg>
      );
    case "watch":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M9.5 7.5l.5-4h4l.5 4M9.5 16.5l.5 4h4l.5-4" />
        </svg>
      );
    case "hat":
      return (
        <svg {...props}>
          <path d="M3 17h18M5 17c0-5 3-9 7-9s7 4 7 9" />
        </svg>
      );
  }
}

const PRODUCT_PRICE: Record<string, string> = {
  glasses1: "$89",
  glasses2: "$110",
  "earrings-simple": "$45",
  "earring-pearl": "$68",
  "earring-louboutin": "$120",
  "black-panther": "$95",
  "necklace-egyptian": "$140",
  "necklace-native": "$160",
  "ring-placeholder2": "$210",
  "watch-casio": "$75",
  "watch-bamboo": "$130",
  "watch-richard-mille": "$240",
  "watch-band": "$40",
  "hat-draco": "$55",
  "hat-headphones": "$80",
  "hat-moto": "$150",
};

function CategoryGlyph({ id, className }: { id: CategoryType; className?: string }) {
  const props = {
    viewBox: "0 0 24 24",
    className: className ?? "size-[18px] shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (id) {
    case "glasses":
      return (
        <svg {...props}>
          <rect x="2.2" y="9.2" width="7.6" height="5.6" rx="1.8" />
          <rect x="14.2" y="9.2" width="7.6" height="5.6" rx="1.8" />
          <path d="M9.8 12h4.4" />
        </svg>
      );
    case "earrings":
      return (
        <svg {...props}>
          <circle cx="12" cy="6.2" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="13.2" r="3.3" />
        </svg>
      );
    case "necklace":
      return (
        <svg {...props}>
          <path d="M5 8.5c2 6.2 3.8 8 7 8s5-1.8 7-8" />
          <circle cx="12" cy="17.2" r="1.45" />
        </svg>
      );
    case "ring":
      return (
        <svg {...props}>
          <circle cx="12" cy="14" r="4" />
          <path d="M10.4 10.2 12 7.6l1.6 2.6" />
        </svg>
      );
    case "watch":
      return (
        <svg {...props}>
          <rect x="7.75" y="7" width="8.5" height="10" rx="2.2" />
          <path d="M9.6 7V5.6A1.4 1.4 0 0 1 11 4.2h2a1.4 1.4 0 0 1 1.4 1.4V7M9.6 17v1.4a1.4 1.4 0 0 0 1.4 1.4h2a1.4 1.4 0 0 0 1.4-1.4V17" />
        </svg>
      );
    case "hat":
      return (
        <svg {...props}>
          <path d="M4 15.5h16" />
          <path d="M7.2 15.5c.4-3.8 2.1-6 4.8-6s4.4 2.2 4.8 6" />
          <path d="M8.6 9.4c.5-1.4 1.6-2.2 3.4-2.2" />
        </svg>
      );
  }
}

/** Build ModelConfig for TryOnCanvas from a VTO product */
function productToModelConfig(p: VtoProduct) {
  return {
    modelPath: p.modelPath,
    ...(p.occluderPath && { occluderPath: p.occluderPath }),
    ...(p.envmapPath && { envmapPath: p.envmapPath }),
    ...(p.modelScale != null && { modelScale: p.modelScale }),
    ...(p.modelOffset && { modelOffset: p.modelOffset }),
    ...(p.modelQuaternion && { modelQuaternion: p.modelQuaternion }),
    ...(p.applyHandPlacement && { applyHandPlacement: true }),
  };
}

function TryOnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as CategoryType | null;

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(categoryParam || "glasses");
  /** Selected product id per category so we remember choice when switching back */
  const [selectedProductIdByCategory, setSelectedProductIdByCategory] = useState<Partial<Record<CategoryType, string>>>({});
  const [settings, setSettings] = useState<ControlSettings>(defaultSettings);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveTrackingStatus>("loading");
  const [showGestureHints, setShowGestureHints] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [strap, setStrap] = useState(0);
  const cameraViewRef = useRef<CameraViewHandle | null>(null);

  useEffect(() => {
    const hasSeenGestures = localStorage.getItem("vto_seen_gestures");
    if (!hasSeenGestures && window.innerWidth < 1024) {
      const timer = setTimeout(() => setShowGestureHints(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const isHandCategory = selectedCategory === "ring" || selectedCategory === "watch";
  const trackingMessage =
    liveStatus === "tracking"
      ? isHandCategory
        ? "HAND DETECTED"
        : "FACE DETECTED"
      : liveStatus === "error"
        ? "NO CAMERA"
        : liveStatus === "loading"
          ? "STARTING"
          : isHandCategory
            ? "SHOW HAND"
            : "ALIGN FACE";

  const handleDismissGestures = () => {
    setShowGestureHints(false);
    localStorage.setItem("vto_seen_gestures", "true");
  };

  const vtoCategory = getVtoCategoryById(selectedCategory);
  const currentProductId =
    vtoCategory && (selectedProductIdByCategory[selectedCategory] ?? getDefaultProductId(vtoCategory));
  const currentProduct =
    selectedCategory && currentProductId
      ? getVtoProduct(selectedCategory, currentProductId)
      : undefined;
  const modelConfig = currentProduct ? productToModelConfig(currentProduct) : null;
  const products = vtoCategory?.products ?? [];
  const productIndex = Math.max(0, products.findIndex((p) => p.id === currentProductId));
  const itemCount = `${String(productIndex + 1).padStart(2, "0")}/${String(Math.max(products.length, 1)).padStart(2, "0")}`;
  const priceLabel = (currentProduct && PRODUCT_PRICE[currentProduct.id]) || "—";
  const isFavorite = currentProductId ? favorites.includes(currentProductId) : false;
  const isAdded = currentProductId ? addedIds.includes(currentProductId) : false;
  const fitIndex = FIT_SCALES.reduce(
    (best, scale, index) => (Math.abs(scale - settings.scale) < Math.abs(FIT_SCALES[best] - settings.scale) ? index : best),
    1
  );
  const productName = (currentProduct?.name ?? getCategoryById(selectedCategory)?.name ?? "Try on").toUpperCase();

  const handleCategoryChange = (category: CategoryType) => {
    const cat = getVtoCategoryById(category);
    setSelectedCategory(category);
    setSelectedProductIdByCategory((prev) => ({
      ...prev,
      [category]: prev[category] ?? (cat ? getDefaultProductId(cat) : ""),
    }));
    setSettings(defaultSettings);
    router.replace(`/?category=${category}`);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductIdByCategory((prev) => ({ ...prev, [selectedCategory]: productId }));
  };

  const handlePreviousItem = () => {
    if (products.length === 0) return;
    const nextIndex = (productIndex - 1 + products.length) % products.length;
    handleProductSelect(products[nextIndex].id);
  };

  const handleNextItem = () => {
    if (products.length === 0) return;
    handleProductSelect(products[(productIndex + 1) % products.length].id);
  };

  const handleToggleAdded = () => {
    if (!currentProductId) return;
    setAddedIds((prev) =>
      prev.includes(currentProductId) ? prev.filter((id) => id !== currentProductId) : [...prev, currentProductId]
    );
  };

  const setFit = (index: number) => {
    setSettings((prev) => ({ ...prev, scale: FIT_SCALES[index] }));
  };

  const handleToggleFavorite = () => {
    if (!currentProductId) return;
    setFavorites((prev) =>
      prev.includes(currentProductId) ? prev.filter((id) => id !== currentProductId) : [...prev, currentProductId]
    );
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setStrap(0);
    if (currentProductId) setAddedIds((prev) => prev.filter((id) => id !== currentProductId));
    toast.success("Controls reset to default");
  };

  const handleFlipCamera = () => {
    void cameraViewRef.current?.flipCamera();
  };

  const handleCapture = async (imageData: string) => {
    if (!beforeImage) {
      setBeforeImage(imageData);
      toast.info("Before image captured! Now try on an accessory and capture again.");
      return;
    }
    setCapturedImage(imageData);
  };

  const captureFromCanvas = async () => {
    setCaptureFlash(true);
    setTimeout(() => setCaptureFlash(false), 60);
    try {
      if (cameraViewRef.current) {
        const imageData = await cameraViewRef.current.capture();
        if (imageData) {
          handleCapture(imageData);
          return;
        }
      }

      const captureFn = (window as any).__cameraViewCapture;
      if (captureFn) {
        const imageData = await captureFn();
        if (imageData) {
          handleCapture(imageData);
          return;
        }
      }

      const canvas = document.querySelector('canvas[id="WebARRocksFaceCanvas"]') as HTMLCanvasElement;
      const canvasThree = document.querySelector('canvas[id="threeCanvas"]') as HTMLCanvasElement;

      if (canvas) {
        const out = document.createElement("canvas");
        out.width = canvas.width;
        out.height = canvas.height;
        const ctx = out.getContext("2d");
        if (ctx) {
          ctx.translate(out.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(canvas, 0, 0);
          if (canvasThree) {
            ctx.drawImage(canvasThree, 0, 0);
          }
          const imageData = out.toDataURL("image/png");
          handleCapture(imageData);
        }
      }
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to capture image");
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    toast.success("Look saved to your gallery!");
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement("a");
      link.href = capturedImage;
      link.download = `vto-${selectedCategory}-${Date.now()}.png`;
      link.click();
      toast.success("Image downloaded!");
    }
  };

  const handleShare = async () => {
    if (capturedImage) {
      try {
        const blob = await (await fetch(capturedImage)).blob();
        const file = new File([blob], "vto-image.png", { type: "image/png" });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "AuraTry",
            text: `Check out how I look with this ${getCategoryById(selectedCategory)?.name}!`,
          });
        } else {
          toast.info("Share not available. Image saved!");
        }
      } catch (error) {
        console.error("Share error:", error);
      }
    }
  };

  const category = getCategoryById(selectedCategory);
  if (!category) return null;

  if (capturedImage) {
    return (
      <>
        <Toaster />
        <div className="h-[100svh] bg-black text-white flex flex-col">
          <header className="flex items-center justify-between px-4 h-16 shrink-0">
            <div className="min-w-0">
              <p className="font-display truncate text-[18px] font-bold uppercase tracking-tight">{currentProduct?.name ?? category.name}</p>
              <p className="font-label text-[11px] tracking-[0.14em] text-[var(--cream)]/70">{RAIL_LABEL[selectedCategory]}</p>
            </div>
            <button
              type="button"
              onClick={() => setCapturedImage(null)}
              aria-label="Close"
              className="vto-key flex size-12 items-center justify-center"
            >
              <X className="size-5" strokeWidth={2.25} />
            </button>
          </header>

          <div className="flex-1 min-h-0 px-4">
            {showCompare && beforeImage ? (
              <CompareView beforeImage={beforeImage} afterImage={capturedImage} />
            ) : (
              <img
                src={capturedImage}
                alt="Captured look"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="vto-dock shrink-0 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-lg items-center justify-center gap-2">
              <button type="button" onClick={() => setCapturedImage(null)} className="vto-key flex items-center gap-2 px-3 py-2 text-sm font-label font-bold">
                <Camera className="size-4" strokeWidth={2.25} />
                Retake
              </button>
              <button type="button" onClick={handleSave} className="vto-key flex items-center gap-2 px-3 py-2 text-sm font-label font-bold">
                <Heart className={`size-4 ${isSaved ? "fill-current" : ""}`} strokeWidth={2.25} />
                Save
              </button>
              {beforeImage && (
                <button type="button" onClick={() => setShowCompare(!showCompare)} className="vto-key flex items-center gap-2 px-3 py-2 text-sm font-label font-bold">
                  <ArrowLeftRight className="size-4" strokeWidth={2.25} />
                  {showCompare ? "Photo" : "Compare"}
                </button>
              )}
              <button type="button" onClick={handleDownload} aria-label="Download" className="vto-key flex size-11 items-center justify-center">
                <Download className="size-4" strokeWidth={2.25} />
              </button>
              <button type="button" onClick={handleShare} aria-label="Share" className="vto-key flex size-11 items-center justify-center">
                <Share2 className="size-4" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="relative h-[100svh] overflow-hidden bg-black text-white lg:flex lg:h-auto lg:min-h-[100svh] lg:items-stretch lg:gap-5 lg:overflow-auto lg:bg-[#0d0e10] lg:p-5">
        <div className="relative h-full lg:h-[min(860px,calc(100svh-40px))] lg:min-w-0 lg:flex-[999_1_560px] lg:overflow-hidden lg:rounded-[16px] lg:border-2 lg:border-[#F4EFE3]">
        {captureFlash && (
          <div
            className="fixed inset-0 z-[100] pointer-events-none bg-white/70 vto-capture-flash"
            aria-hidden
          />
        )}

        <CameraView
          ref={cameraViewRef}
          onCapture={handleCapture}
          activeCategory={selectedCategory}
          controls={settings}
          modelConfig={modelConfig ?? undefined}
          onStatusChange={(status) => {
            setLiveStatus(status);
          }}
        />

        <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-[max(14px,env(safe-area-inset-top))] lg:hidden">
          <button type="button" onClick={() => setShowGestureHints(false)} aria-label="Close" className="vto-key flex size-12 items-center justify-center">
            <X className="size-5" strokeWidth={2.25} />
          </button>
          <span className="vto-status mt-1">{trackingMessage}</span>
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? "Remove favorite" : "Favorite"}
            aria-pressed={isFavorite}
            className="vto-key flex size-12 items-center justify-center"
          >
            <Heart className={`size-5 ${isFavorite ? "fill-current" : ""}`} strokeWidth={2.25} />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center justify-between pr-0 lg:hidden" style={{ top: "calc(4.75rem + env(safe-area-inset-top))", bottom: "calc(10.25rem + env(safe-area-inset-bottom))" }}>
          <div className="pointer-events-auto flex flex-col items-start gap-2 pl-4">
            <button type="button" onClick={handlePreviousItem} aria-label="Previous item" className="vto-key flex size-12 items-center justify-center">
              <ChevronLeft className="size-5" strokeWidth={2.25} />
            </button>
            <span className="vto-tag">{itemCount}</span>
          </div>

          <nav aria-label="Categories" className="vto-rail pointer-events-auto max-h-full">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`vto-mode-${cat.id}`}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  aria-pressed={active}
                  className="vto-rail-item"
                >
                  <CategoryGlyph id={cat.id} className="size-5 shrink-0" />
                  <span className="font-label text-[10px] font-bold tracking-[0.12em]">{RAIL_LABEL[cat.id]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="vto-dock absolute inset-x-0 bottom-0 z-30 px-5 pt-3.5 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-display min-w-0 truncate text-[22px] font-bold uppercase leading-none tracking-tight">
              {currentProduct?.name ?? category.name}
            </p>
            <span className="vto-tag shrink-0">{priceLabel}</span>
          </div>
          <div className="grid grid-cols-3 items-center">
            <div className="flex justify-start">
              <button type="button" onClick={handleReset} aria-label="Reset fit" className="vto-key flex size-[52px] items-center justify-center">
                <RotateCcw className="size-5" strokeWidth={2.25} />
              </button>
            </div>
            <div className="flex justify-center">
              <button type="button" onClick={captureFromCanvas} aria-label="Capture" className="vto-shutter">
                <span className="vto-shutter-disc" />
              </button>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={handleFlipCamera} aria-label="Flip camera" className="vto-key flex size-[52px] items-center justify-center">
                <SwitchCamera className="size-5" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute left-5 right-5 top-5 z-30 hidden items-center justify-between lg:flex">
          <a href="/" className="vto-desk-key vto-desk-wide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
            BACK TO SHOP
          </a>
          <div className="vto-desk-status">{trackingMessage}</div>
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? "Remove favorite" : "Favorite"}
            aria-pressed={isFavorite}
            className="vto-desk-key"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
              <path d="M12 20l-7-7a4.2 4.2 0 0 1 7-4.5A4.2 4.2 0 0 1 19 13z" />
            </svg>
          </button>
        </div>

        <div className="absolute left-5 top-[340px] z-30 hidden flex-col items-center gap-2.5 lg:flex">
          <button type="button" onClick={handlePreviousItem} aria-label="Previous item" className="vto-desk-key">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={handleNextItem} aria-label="Next item" className="vto-desk-key">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <span className="vto-desk-count">{itemCount}</span>
        </div>

        <nav aria-label="Categories" className="vto-desk-rail z-30 hidden lg:block">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                aria-pressed={active}
                aria-label={cat.name}
                className="vto-desk-rail-item"
              >
                <DeskIcon id={cat.id} />
                <span className="font-label text-[11px] font-bold tracking-[0.06em]">{RAIL_LABEL[cat.id]}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 z-30 hidden h-[124px] items-center justify-between border-t-2 border-[#F4EFE3] bg-[#111111] px-7 lg:flex">
          <div className="min-w-0">
            <div className="truncate font-display text-2xl font-extrabold leading-none text-[#F4EFE3]">{productName}</div>
            <div className="mt-2.5 inline-block rounded bg-[#F4EFE3] px-[9px] py-[5px] font-label text-[13px] font-bold text-[#111111]">{priceLabel}</div>
          </div>
          <div className="flex items-center gap-6">
            <button type="button" onClick={handleReset} aria-label="Reset" className="vto-desk-key">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
                <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />
              </svg>
            </button>
            <button type="button" onClick={captureFromCanvas} aria-label="Capture" className="flex size-[84px] rounded-full border-2 border-[#F4EFE3] bg-transparent p-[5px]">
              <span className="block flex-1 rounded-full border-[3px] border-[#111111] bg-[#FFC928]" />
            </button>
            <button type="button" onClick={handleFlipCamera} aria-label="Flip camera" className="vto-desk-key">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
                <path d="M4 8h13l-3-3M20 16H7l3 3" />
              </svg>
            </button>
          </div>
          <div className="hidden w-[220px] shrink-0 xl:block" aria-hidden />
        </div>
        </div>

        <aside className="vto-desk-panel hidden lg:block">
          <div className="font-label text-xs font-bold tracking-[0.08em]">{RAIL_LABEL[selectedCategory]} / {itemCount}</div>
          <div className="font-display mt-2 text-[32px] font-extrabold leading-[1.1]">{productName}</div>
          <div className="mt-3 inline-block rounded bg-[#111111] px-2.5 py-1.5 font-label text-sm font-bold text-[#F4EFE3]">{priceLabel}</div>

          <div className="mb-2.5 mt-[22px] font-label text-[11px] font-bold tracking-[0.08em]">STRAP</div>
          <div className="flex gap-3">
            {STRAPS.map((color, index) => (
              <button
                key={color}
                type="button"
                aria-label={`Strap ${index + 1}`}
                aria-pressed={strap === index}
                onClick={() => setStrap(index)}
                className="size-12 rounded-full"
                style={{
                  background: color,
                  border: strap === index ? "4px solid #111111" : "2px solid #8a8a82",
                }}
              />
            ))}
          </div>

          <div className="mb-2.5 mt-[22px] font-label text-[11px] font-bold tracking-[0.08em]">FIT</div>
          <div className="flex items-center gap-3.5">
            <button type="button" onClick={() => setFit(Math.max(0, fitIndex - 1))} aria-label="Smaller" className="vto-desk-key">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
                <path d="M6 12h12" />
              </svg>
            </button>
            <span className="w-12 text-center font-label text-xl font-bold">{FIT_LABELS[fitIndex]}</span>
            <button type="button" onClick={() => setFit(Math.min(2, fitIndex + 1))} aria-label="Larger" className="vto-desk-key">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
                <path d="M12 6v12M6 12h12" />
              </svg>
            </button>
          </div>

          <div className="mb-2.5 mt-[22px] font-label text-[11px] font-bold tracking-[0.08em]">MORE IN {RAIL_LABEL[selectedCategory]}</div>
          <div className="flex flex-col gap-2.5">
            {products.map((product, index) => {
              const selected = product.id === currentProductId;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product.id)}
                  aria-pressed={selected}
                  className="flex h-14 items-center gap-3.5 rounded-[10px] border-2 border-[#111111] px-4 text-left font-display text-[15px] font-bold"
                  style={{ background: selected ? "#FFC928" : "#F4EFE3" }}
                >
                  <span className="font-label text-xs">{String(index + 1).padStart(2, "0")}</span>
                  {product.name.toUpperCase()}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleToggleAdded}
            className="mt-7 flex h-14 w-full items-center justify-center gap-2.5 rounded-[10px] border-2 border-[#111111] font-label text-sm font-bold tracking-[0.08em] shadow-[4px_4px_0_#111111]"
            style={{ background: isAdded ? "#F4EFE3" : "#FFC928" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden>
              <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {isAdded ? "ADDED - TAP TO UNDO" : "ADD TO CART"}
          </button>
        </aside>

        <AnimatePresence>{showGestureHints && <GestureHints onDismiss={handleDismissGestures} />}</AnimatePresence>
      </div>
    </>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function TryOnPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <TryOnPageContent />
    </Suspense>
  );
}
