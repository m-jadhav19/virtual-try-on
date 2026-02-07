"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
import { CategoryPill } from "@/components/CategoryPill";
import { ProductTray } from "@/components/ProductTray";
import { TrackingStatus, TrackingState } from "@/components/TrackingStatus";
import { GestureHints } from "@/components/GestureHints";
import { CompareView } from "@/components/CompareView";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Heart, Lightbulb, X, Download, Share2, ArrowLeftRight } from "lucide-react";
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

/** Build ModelConfig for TryOnCanvas from a VTO product */
function productToModelConfig(p: VtoProduct) {
  return {
    modelPath: p.modelPath,
    ...(p.occluderPath && { occluderPath: p.occluderPath }),
    ...(p.envmapPath && { envmapPath: p.envmapPath }),
    ...(p.modelScale != null && { modelScale: p.modelScale }),
    ...(p.modelOffset && { modelOffset: p.modelOffset }),
    ...(p.modelQuaternion && { modelQuaternion: p.modelQuaternion }),
  };
}

export default function TryOnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") as CategoryType | null;

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(categoryParam || "glasses");
  /** Selected product id per category so we remember choice when switching back */
  const [selectedProductIdByCategory, setSelectedProductIdByCategory] = useState<Partial<Record<CategoryType, string>>>({});
  const [settings, setSettings] = useState<ControlSettings>(defaultSettings);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingState>("stable");
  const [showGestureHints, setShowGestureHints] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [captureFlash, setCaptureFlash] = useState(false);
  const cameraViewRef = useRef<CameraViewHandle | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const hasSeenGestures = localStorage.getItem("vto_seen_gestures");
    if (!hasSeenGestures && window.innerWidth < 1024) {
      setTimeout(() => setShowGestureHints(true), 1500);
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random > 0.9) {
        setTrackingState("warning");
      } else if (random > 0.85) {
        setTrackingState("searching");
      } else {
        setTrackingState("stable");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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

  const handleCategoryChange = (category: CategoryType) => {
    const cat = getVtoCategoryById(category);
    setSelectedCategory(category);
    setSelectedProductIdByCategory((prev) => ({
      ...prev,
      [category]: prev[category] ?? (cat ? getDefaultProductId(cat) : ""),
    }));
    setSettings(defaultSettings);
    toast.success(`Switched to ${getCategoryById(category)?.name}`);
    router.replace(`/?category=${category}`);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductIdByCategory((prev) => ({ ...prev, [selectedCategory]: productId }));
    toast.success(getVtoProduct(selectedCategory, productId)?.name ?? "Model selected");
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.success("Controls reset to default");
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
        <div className="h-screen bg-[var(--vto-bg-primary)] flex flex-col">
          <header className="vto-glass border-b border-[var(--vto-border-soft)] rounded-none px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--vto-accent-primary)] text-[var(--vto-bg-primary)]">
                <Camera className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold text-[var(--foreground)]">Captured Look</h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {category.name} — {currentProduct?.name ?? "—"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCapturedImage(null)}>
              <X className="size-5" />
            </Button>
          </header>

          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-4xl w-full h-full">
              {showCompare && beforeImage ? (
                <CompareView beforeImage={beforeImage} afterImage={capturedImage} />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured look"
                  className="w-full h-full object-contain rounded-2xl"
                />
              )}
            </div>
          </div>

          <div className="vto-glass border-t border-[var(--vto-border-soft)] rounded-none p-4 sm:p-6">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setCapturedImage(null)} variant="outline" className="flex-1" size="lg">
                <Camera className="size-5 mr-2" />
                Retake
              </Button>
              <Button onClick={handleSave} variant="emotional" className="flex-1" size="lg">
                <Heart className={`size-5 mr-2 ${isSaved ? "fill-current" : ""}`} />
                Save
              </Button>
              {beforeImage && (
                <Button
                  onClick={() => setShowCompare(!showCompare)}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <ArrowLeftRight className="size-5 mr-2" />
                  {showCompare ? "View Photo" : "Compare"}
                </Button>
              )}
              <Button onClick={handleDownload} variant="outline" className="flex-1" size="lg">
                <Download className="size-5 mr-2" />
                Download
              </Button>
              <Button onClick={handleShare} className="flex-1" size="lg">
                <Share2 className="size-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="h-screen bg-[var(--vto-bg-primary)] flex flex-col overflow-hidden">
        {captureFlash && (
          <div
            className="fixed inset-0 z-[100] pointer-events-none bg-white/80 vto-capture-flash"
            aria-hidden
          />
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 lg:w-[70%] p-4 sm:p-6 flex items-center justify-center bg-[var(--vto-bg-primary)] relative">
            <div className="w-full h-full max-w-5xl">
              <CameraView
                ref={cameraViewRef}
                onCapture={handleCapture}
                activeCategory={selectedCategory}
                controls={settings}
                modelConfig={modelConfig ?? undefined}
              />
            </div>

            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
              <TrackingStatus
                state={trackingState}
                message={
                  trackingState === "stable"
                    ? "✔ Tracking Stable"
                    : trackingState === "warning"
                      ? "⚠ Move closer"
                      : "🔄 Aligning..."
                }
              />
            </div>

          </div>

          {!isMobile && (
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
              className="w-[320px] shrink-0 vto-glass border-l border-[var(--vto-border-soft)] rounded-none p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div>
                <h2 className="text-lg font-bold text-white mb-3">Category</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <CategoryPill
                      key={cat.id}
                      icon={cat.icon}
                      label={cat.name}
                      categoryId={cat.id}
                      isActive={selectedCategory === cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                    />
                  ))}
                </div>
              </div>

              {vtoCategory && vtoCategory.products.length > 0 && (
                <motion.div
                  key={selectedCategory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
                >
                  <p className="text-xs text-white/60 mb-2">Model</p>
                  <div className="flex flex-wrap gap-2">
                    {vtoCategory.products.map((p) => (
                      <motion.button
                        key={p.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
                        onClick={() => handleProductSelect(p.id)}
                        className={"flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 " + (currentProductId === p.id ? "bg-white/15 text-white border border-white/30" : "vto-glass text-white/70 border border-transparent hover:text-white/90")}
                      >
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <span className="w-8 h-8 rounded flex items-center justify-center bg-white/10 text-lg" aria-hidden>{vtoCategory.icon}</span>
                        )}
                        <span>{p.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>{category.icon}</span>
                  <div>
                    <div className="font-semibold text-white">{category.name}</div>
                    <div className="text-sm text-white/70">{currentProduct?.name ?? "—"}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="sm" className="justify-start text-white/80 hover:text-white hover:bg-white/10">
                    <Lightbulb className="size-5 mr-2" />
                    Tips
                  </Button>
                  <Button variant="emotional" size="sm" className="justify-start" onClick={handleSave}>
                    <Heart className={`size-5 mr-2 ${isSaved ? "fill-current" : ""}`} />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start border-white/20 text-white/90 hover:bg-white/10 hover:text-white" onClick={handleReset}>
                    <RotateCcw className="size-5 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" className="w-full justify-center" onClick={captureFromCanvas}>
                    <Camera className="size-5 mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {isMobile && (
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
          className="vto-glass border-t border-[var(--vto-border-soft)] rounded-none flex flex-col"
        >
          <div className="px-4 sm:px-6 pt-4 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  icon={cat.icon}
                  label={cat.name}
                  categoryId={cat.id}
                  isActive={selectedCategory === cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                />
              ))}
            </div>
          </div>

          {vtoCategory && vtoCategory.products.length > 0 && (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
              className="px-4 sm:px-6 py-2"
            >
              <p className="text-xs text-white/60 mb-2">Model</p>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {vtoCategory.products.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
                    onClick={() => handleProductSelect(p.id)}
                    className={"flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 " + (currentProductId === p.id ? "bg-white/15 text-white border border-white/30" : "vto-glass text-white/70 border border-transparent hover:text-white/90")}
                  >
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="w-8 h-8 rounded flex items-center justify-center bg-white/10 text-lg" aria-hidden>{vtoCategory.icon}</span>
                    )}
                    <span>{p.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="p-4 flex items-center justify-around">
            <Button size="sm" onClick={captureFromCanvas}>
              <Camera className="size-5 mr-2" />
              Capture
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="size-5 mr-2" />
              Reset
            </Button>
          </div>
        </motion.div>
        )}

        {isMobile && (
          <ProductTray
            category={selectedCategory}
            categoryIcon={category.icon}
            categoryName={category.name}
            currentProduct={{
              id: currentProduct?.id ?? "",
              name: currentProduct?.name ?? "—",
              thumbnail: currentProduct?.thumbnail ?? "",
            }}
          />
        )}

        <AnimatePresence>{showGestureHints && <GestureHints onDismiss={handleDismissGestures} />}</AnimatePresence>
      </div>
    </>
  );
}
