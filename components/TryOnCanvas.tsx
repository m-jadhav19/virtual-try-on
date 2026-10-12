'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

export type Category = 'necklace' | 'earrings' | 'glasses' | 'hat' | 'ring' | 'watch';

/**
 * Supersample index into the jitter table. 2 → 4 samples.
 * 3 (8 samples) softens thin frames and costs a full extra scene render per sample.
 */
const TAA_LEVEL = 2;

/** Highlight-only bloom. Threshold stays high so skin and the camera feed do not glow. */
const BLOOM_BY_CATEGORY: Record<Category, { strength: number; radius: number; threshold: number }> = {
  glasses: { strength: 0.3, radius: 0.4, threshold: 0.85 },
  earrings: { strength: 0.52, radius: 0.46, threshold: 0.66 },
  necklace: { strength: 0.48, radius: 0.55, threshold: 0.7 },
  hat: { strength: 0.14, radius: 0.32, threshold: 0.9 },
  ring: { strength: 0.58, radius: 0.38, threshold: 0.68 },
  watch: { strength: 0.36, radius: 0.42, threshold: 0.76 },
};

export type TrackingStatus = 'loading' | 'searching' | 'tracking' | 'error';

export interface TransformOverrides {
  scale?: number;
  height?: number;
  rotation?: number;
  depth?: number;
}

/** Optional per-product model paths and hand-mode overrides (from vto-products.json) */
export interface ModelConfig {
  modelPath: string;
  occluderPath?: string;
  envmapPath?: string;
  modelScale?: number;
  modelOffset?: [number, number, number];
  modelQuaternion?: [number, number, number, number];
  applyHandPlacement?: boolean;
}

interface Props {
  category: Category;
  onError?: (error: Error) => void;
  onStatusChange?: (status: TrackingStatus, text: string) => void;
  transformOverrides?: TransformOverrides;
  /** When set, overrides default model paths for this category (from vto-products) */
  modelConfig?: ModelConfig | null;
}

declare global {
  interface Window {
    WebARRocksMirror: any;
    WebARRocksFaceEarrings3DHelper: any;
    HandTrackerThreeHelper: any;
    WebARRocksResizer: any;
    PoseFlipFilter: any;
    WEBARROCKSFACE: any;
    WEBARROCKSHAND: any;
    THREE: any;
    WebARRocksFaceThreeHelper: any;
  }
}

export type TryOnCanvasHandle = {
  capture: () => Promise<string | void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  flipCamera: () => Promise<void>;
};

// Global Sequence Queue (Module Scope) - MUST be outside component to persist across renders
let globalSequence = Promise.resolve();

const DRACO_DECODER_PATH = '/webar/libs/three/v136/examples/js/libs/draco/';

/** Head-worn models share the headphones demo pose, not the glasses net (that net has no ear/temple points these meshes were built on). */
const HAT_SOLVE_PNP_POSITIONS = {
  noseLeft: [21.86215, -0.121031, 67.803383],
  noseRight: [-20.539499, 0.170727, 69.944778],
  leftEyeExt: [44.507431, 34.942841, 38.750019],
  rightEyeExt: [-44.064968, 35.39967, 39.36293],
  leftEarTop: [89.165428, 16.312811, -49.06498],
  leftEarBase: [78.738243, -6.04455, -23.17749],
  leftEarBottom: [78.78685, -41.321789, -24.603769],
  rightEarTop: [-88.488602, 17.2714, -48.199409],
  rightEarBase: [-78.156998, -5.305619, -22.164619],
  rightEarBottom: [-78.945511, -41.2551, -26.536131],
  leftTemple: [60.26297, 83.790382, -13.54031],
  rightTemple: [-60.03476, 83.584427, -13.24853],
  foreHead: [-1.057755, 97.894547, 24.65494],
};

const HAT_SOLVE_PNP_LABELS = [
  'foreHead',
  'leftTemple',
  'rightTemple',
  'leftEarTop',
  'rightEarTop',
  'leftEyeExt',
  'rightEyeExt',
  'rightEarBottom',
  'leftEarBottom',
];

function readViewCssSize(el: HTMLElement | null): { w: number; h: number } | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  return { w: rect.width, h: rect.height };
}

function viewPixelSize(css: { w: number; h: number }) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return {
    w: Math.max(2, Math.round(css.w * dpr)),
    h: Math.max(2, Math.round(css.h * dpr)),
  };
}

function handPlacementNeeded(cfg: ModelConfig | null | undefined) {
  if (!cfg) return false;
  if (cfg.applyHandPlacement) return true;
  const offset = cfg.modelOffset;
  const quat = cfg.modelQuaternion;
  const moved = !!offset && (offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0);
  const rotated = !!quat && !(quat[0] === 0 && quat[1] === 0 && quat[2] === 0 && Math.abs(quat[3]) === 1);
  return moved || rotated;
}

function mountEarringPair(
  three: any,
  modelURL: string,
  gen: number,
  genRef: { current: number },
  onError?: (error: Error) => void,
) {
  const dracoLoader = new window.THREE.DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  const loader = new window.THREE.GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.load(
    modelURL,
    (gltf: any) => {
      if (gen !== genRef.current) return;
      const model = gltf.scene;
      model.scale.multiplyScalar(100);
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.material.roughness = 0.0;
          child.material.metalness = 1.0;
        }
      });
      const clearModels = (node: any) => {
        for (let i = node.children.length - 1; i >= 0; i--) {
          if (node.children[i].userData?.isOccluder) continue;
          node.remove(node.children[i]);
        }
      };
      clearModels(three.earringRight);
      clearModels(three.earringLeft);
      three.earringRight.add(model);
      three.earringLeft.add(model.clone());
    },
    undefined,
    () => onError?.(new Error(`Failed to load model: ${modelURL}`)),
  );
}

function mountHandAccessory(
  modelURL: string,
  cfg: ModelConfig | null | undefined,
  gen: number,
  genRef: { current: number },
  handModelRef: { current: { mesh: any; baseScale: number; basePosition: [number, number, number]; baseQuaternion: [number, number, number, number] } | null },
  onError?: (error: Error) => void,
) {
  const dracoLoader = new window.THREE.DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  const gltfLoader = new window.THREE.GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  gltfLoader.load(
    modelURL,
    (model: any) => {
      if (gen !== genRef.current) return;
      const me = model.scene.children[0];
      if (handPlacementNeeded(cfg)) {
        if (cfg?.modelOffset) {
          me.position.add(new window.THREE.Vector3(cfg.modelOffset[0], cfg.modelOffset[1], cfg.modelOffset[2]));
        }
        if (cfg?.modelQuaternion) {
          const q = cfg.modelQuaternion;
          me.quaternion.set(q[0], q[2], -q[1], q[3]);
        }
      }
      handModelRef.current = {
        mesh: me,
        baseScale: cfg?.modelScale ?? 1,
        basePosition: [me.position.x, me.position.y, me.position.z],
        baseQuaternion: [me.quaternion.x, me.quaternion.y, me.quaternion.z, me.quaternion.w],
      };
      window.HandTrackerThreeHelper.clear_threeObjects(false);
      window.HandTrackerThreeHelper.add_threeObject(me);
    },
    undefined,
    () => onError?.(new Error(`Failed to load model: ${modelURL}`)),
  );
}

const TryOnCanvas = forwardRef<TryOnCanvasHandle, Props>(function TryOnCanvas(
  { category, onError, onStatusChange, transformOverrides, modelConfig }: Props,
  ref
) {
  const canvasFaceRef = useRef<HTMLCanvasElement>(null);
  const canvasThreeRef = useRef<HTMLCanvasElement>(null);
  const handModelRef = useRef<{ mesh: any; baseScale: number; basePosition: [number, number, number]; baseQuaternion: [number, number, number, number] } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState<'user' | 'environment'>('user');
  const [loadingText, setLoadingText] = useState('Loading engine…');

  // Keep latest callback in a ref so status updates never trigger re-init (avoid camera reset on "come closer" / "aligning")
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const sessionRef = useRef<{ category: Category; path: string; earrings?: any } | null>(null);
  const loadGenRef = useRef(0);
  const resizeTrackerRef = useRef<((cssW: number, cssH: number) => void) | null>(null);

  const updateStatus = (status: TrackingStatus, text: string) => {
    setLoadingText(text);
    onStatusChangeRef.current?.(status, text);
  };

  const isHandMode = useMemo(() => category === 'ring' || category === 'watch', [category]);

  // Expose UI actions:
  useImperativeHandle(
    ref,
    () => ({
      capture: async () => {
        const cvFace = canvasFaceRef.current;
        const cvThree = canvasThreeRef.current;
        if (!cvFace || !cvThree) return;

        try {
          // Prefer built-in capture when available (Face VTO):
          if (!isHandMode && window.WebARRocksMirror && window.WebARRocksMirror.capture_image) {
            return new Promise((resolve) => {
              window.WebARRocksMirror.capture_image((cv: HTMLCanvasElement) => {
                if (cv) {
                  resolve(cv.toDataURL('image/png'));
                } else {
                  resolve('');
                }
              });
            });
          }

          // Generic composite capture:
          // Ensure we have valid dimensions
          if (!cvFace.width || !cvFace.height) throw new Error("Canvas has no dimensions");

          const out = document.createElement('canvas');
          out.width = cvFace.width;
          out.height = cvFace.height;
          const ctx = out.getContext('2d');
          if (!ctx) throw new Error("Could not get 2d context for capture");

          // Mirror output only for selfie face mode:
          const shouldMirror = !isHandMode;
          if (shouldMirror) {
            ctx.translate(out.width, 0);
            ctx.scale(-1, 1);
          }

          ctx.drawImage(cvFace, 0, 0);
          // Only draw 3D overlay if it exists and has content
          try {
            ctx.drawImage(cvThree, 0, 0);
          } catch (e) {
            console.warn("Could not draw 3D overlay", e);
          }

          const dataURL = out.toDataURL('image/png');
          return Promise.resolve(dataURL);
        } catch (e: any) {
          console.error("Capture error:", e);
          onErrorRef.current?.(e);
          return Promise.reject(e);
        }
      },
      pause: async () => {
        try {
          if (isHandMode) {
            // No dedicated pause in helper; stop rendering/camera would require SDK toggle.
            // For now, we toggle pause if available:
            if (window.WEBARROCKSHAND?.toggle_pause) {
              await window.WEBARROCKSHAND.toggle_pause(true);
            }
          } else {
            if (window.WebARRocksMirror?.pause) {
              window.WebARRocksMirror.pause(true);
            } else if (window.WEBARROCKSFACE?.toggle_pause) {
              window.WEBARROCKSFACE.toggle_pause(true, true);
            }
          }
          setIsPaused(true);
          updateStatus('searching', 'Paused');
        } catch (e: any) {
          onErrorRef.current?.(e);
        }
      },
      resume: async () => {
        try {
          if (isHandMode) {
            if (window.WEBARROCKSHAND?.toggle_pause) {
              await window.WEBARROCKSHAND.toggle_pause(false);
            }
          } else {
            if (window.WebARRocksMirror?.resume) {
              window.WebARRocksMirror.resume(true);
            } else if (window.WEBARROCKSFACE?.toggle_pause) {
              window.WEBARROCKSFACE.toggle_pause(false, true);
            }
          }
          setIsPaused(false);
          updateStatus('tracking', isHandMode ? 'Tracking Hand' : 'Tracking Face');
        } catch (e: any) {
          onErrorRef.current?.(e);
        }
      },
      flipCamera: async () => {
        try {
          const next = cameraMode === 'user' ? 'environment' : 'user';
          setCameraMode(next);
          // Re-init will happen via effect dependency (cameraMode)
          updateStatus('loading', 'Flipping camera...');
        } catch (e: any) {
          onErrorRef.current?.(e);
        }
      }
    }),
    [cameraMode, isHandMode]
  );

  // Global queue to serialize all WebAR operations strictly
  // defined outside component to persist across re-renders

  useEffect(() => {
    let isMounted = true;
    let cleanupDone = false;
    let pollTimer: number | null = null;
    let threeInstance: any = null;

    // Helper to wait for conditions
    const waitFor = (predicate: () => boolean, name: string, timeoutMs = 15000, intervalMs = 100) => {
      return new Promise<void>((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
          if (!isMounted) {
            if (pollTimer !== null) window.clearInterval(pollTimer);
            pollTimer = null;
            resolve();
            return;
          }
          try {
            if (predicate()) {
              if (pollTimer !== null) window.clearInterval(pollTimer);
              pollTimer = null;
              resolve();
              return;
            }
          } catch (e) {
            // ignore
          }
          if (Date.now() - start > timeoutMs) {
            if (pollTimer !== null) window.clearInterval(pollTimer);
            pollTimer = null;
            reject(new Error(`Timeout waiting for: ${name}`));
          }
        };
        pollTimer = window.setInterval(tick, intervalMs);
        tick();
      });
    };

    const doDestroy = async () => {
      // Logic: Only destroy the specific helper that was used by the current category
      try {
        if (category === 'necklace' || category === 'glasses' || category === 'hat') {
          if (window.WebARRocksMirror && window.WebARRocksMirror.destroy) {
            await window.WebARRocksMirror.destroy();
          }
        } else if (category === 'earrings') {
          // Earrings uses the core WEBARROCKSFACE directly via helper
          if (window.WEBARROCKSFACE && window.WEBARROCKSFACE.destroy) {
            await window.WEBARROCKSFACE.destroy();
          }
        } else if (category === 'ring' || category === 'watch') {
          if (window.HandTrackerThreeHelper && window.HandTrackerThreeHelper.destroy) {
            await window.HandTrackerThreeHelper.destroy();
          }
        }
      } catch (e) {
        console.warn('Destroy failed:', e);
      }
    };

    // Define Init functions (same as before)
    const initFaceMirror = async () => {
      if (!window.WebARRocksMirror) return;

      let nnPath = '';
      let modelURL = '';
      let occluderURL = '';
      let envmapURL = '';
      let scanThreshold = 0.7;
      let landmarksStabilizerSpec: any = {
        beta: 5,
        minCutOff: 0.001,
        freqRange: [2, 144],
        forceFilterNNInputPxRange: [2.5, 6]
      };

      // Configuration based on category
      let solvePnPObjPointsPositions: any = undefined;
      let solvePnPImgPointsLabels: string[] | undefined = undefined;

      switch (category) {
        case 'necklace':
          nnPath = '/webar/neuralNets/NN_NECKLACE_9.json';
          if (!modelConfig?.modelPath) {
            modelURL = '/webar/assets/necklace/models3D/blackPanther.glb';
            occluderURL = '/webar/assets/necklace/models3D/occluder.glb';
            envmapURL = '/webar/assets/necklace/envmaps/venice_sunset_1k.hdr';
          }
          scanThreshold = 0.7;
          landmarksStabilizerSpec = {
            beta: 5,
            forceFilterNNInputPxRange: [8, 16]
          };
          solvePnPObjPointsPositions = {
            "torsoNeckCenterUp": [0.000006, -78.167770, 33.542694],
            "torsoNeckCenterDown": [0.000004, -112.370636, 44.173981],
            "torsoNeckLeftUp": [77.729225, -1.220459, -42.653336],
            "torsoNeckLeftDown": [130.661072, -11.937241, -44.706360],
            "torsoNeckRightUp": [-77.898209, -1.191437, -42.648613],
            "torsoNeckRightDown": [-130.661041, -11.937241, -44.706360],
            "torsoNeckBackUp": [-0.040026, -11.528961, -99.635696],
            "torsoNeckBackDown": [0.000007, -47.934677, -127.748184]
          };
          solvePnPImgPointsLabels = [
            "torsoNeckCenterUp",
            "torsoNeckLeftUp",
            "torsoNeckRightUp",
            "torsoNeckBackUp",
            "torsoNeckCenterDown",
            "torsoNeckBackDown"
          ];
          break;
        case 'glasses':
          nnPath = '/webar/neuralNets/NN_GLASSES_9.json';
          if (!modelConfig?.modelPath) {
            modelURL = '/webar/assets/glasses/models3D/glasses1.glb';
            occluderURL = '/webar/assets/glasses/models3D/occluder.glb';
            envmapURL = '/webar/assets/glasses/envmaps/venice_sunset_1k.hdr';
          }
          scanThreshold = 0.8;
          landmarksStabilizerSpec = {
            beta: 10,
            minCutOff: 0.001,
            freqRange: [2, 144],
            forceFilterNNInputPxRange: [2.5, 6]
          };
          break;
        case 'hat':
          // Headphones net + the hat demo's ear/temple points. The glasses net
          // solves a different pose, so caps, headphones, and helmets sit on the face.
          nnPath = '/webar/neuralNets/NN_HEADPHONESL_2.json';
          solvePnPObjPointsPositions = HAT_SOLVE_PNP_POSITIONS;
          solvePnPImgPointsLabels = HAT_SOLVE_PNP_LABELS;
          if (!modelConfig?.modelPath) {
            modelURL = '/webar/assets/hat/models3D/hatDraco.glb';
            occluderURL = '/webar/assets/hat/models3D/occluder.glb';
            envmapURL = '/webar/assets/hat/envmaps/venice_sunset_512.hdr';
          }
          scanThreshold = 0.6;
          landmarksStabilizerSpec = {
            beta: 20,
            forceFilterNNInputPxRange: [1.5, 4]
          };
          break;
        default:
          return;
      }
      if (modelConfig?.modelPath) {
        modelURL = modelConfig.modelPath;
        if (modelConfig.occluderPath) occluderURL = modelConfig.occluderPath;
        if (modelConfig.envmapPath) envmapURL = modelConfig.envmapPath;
      }

      try {
        const gen = ++loadGenRef.current;
        const view = readViewCssSize(canvasFaceRef.current) ?? {
          w: window.innerWidth,
          h: window.innerHeight,
        };
        const initConfig: any = {
          canvasFace: canvasFaceRef.current,
          canvasThree: canvasThreeRef.current,
          width: view.w,
          height: view.h,
          videoSettings: { facingMode: cameraMode },
          specWebARRocksFace: {
            NNCPath: nnPath,
            scanSettings: {
              threshold: scanThreshold
            }
          },
          envmapURL,
          modelURL,
          occluderURL,
          pointLightIntensity: 0.8,
          pointLightY: 200,
          taaLevel: TAA_LEVEL,
          bloom: BLOOM_BY_CATEGORY[category],
          landmarksStabilizerSpec,
          debugOccluder: false,
          isGlasses: category === 'glasses',
          // Absolute path so Draco WASM loads correctly (Mirror default is relative and 404s in Next)
          dracoDecoderPath: '/webar/libs/three/v136/examples/js/libs/draco/'
        };

        if (solvePnPObjPointsPositions) {
          initConfig.solvePnPObjPointsPositions = solvePnPObjPointsPositions;
        }
        if (solvePnPImgPointsLabels) {
          initConfig.solvePnPImgPointsLabels = solvePnPImgPointsLabels;
        }

        await window.WebARRocksMirror.init(initConfig);

        if (isMounted && gen === loadGenRef.current) {
          sessionRef.current = { category, path: modelURL };
          setIsLoaded(true);
          setIsPaused(false);
          resizeTrackerRef.current = (cssW, cssH) => {
            window.WebARRocksMirror?.resize(cssW, cssH);
          };
          window.WebARRocksMirror.resize(view.w, view.h);
          updateStatus('tracking', 'Tracking Face');
        }
      } catch (err: any) {
        if (isMounted) {
          onErrorRef.current?.(err);
          updateStatus('error', err.message);
        }
      }
    };

    const startEarrings = async () => {
      const gen = ++loadGenRef.current;
      try {
        const view = readViewCssSize(canvasFaceRef.current);
        if (view && canvasFaceRef.current && canvasThreeRef.current) {
          const px = viewPixelSize(view);
          canvasFaceRef.current.width = px.w;
          canvasFaceRef.current.height = px.h;
          canvasThreeRef.current.width = px.w;
          canvasThreeRef.current.height = px.h;
        }
        const three = await window.WebARRocksFaceEarrings3DHelper.init({
          NN: '/webar/neuralNets/NN_EARS_4.json',
          canvasFace: canvasFaceRef.current,
          canvasThree: canvasThreeRef.current,
          debugOccluder: false,
          taaLevel: TAA_LEVEL,
          bloom: BLOOM_BY_CATEGORY.earrings
        });
        threeInstance = three;

        const pmremGenerator = new window.THREE.PMREMGenerator(three.renderer);
        pmremGenerator.compileEquirectangularShader();
        const envmap = modelConfig?.envmapPath ?? '/webar/assets/earrings/venice_sunset_512.hdr';
        new window.THREE.RGBELoader().setDataType(window.THREE.HalfFloatType)
          .load(envmap, (texture: any) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();
            three.scene.environment = envMap;
          });

        const earringsModel = modelConfig?.modelPath ?? '/webar/assets/earrings/earringsSimple.glb';
        if (!isMounted || gen !== loadGenRef.current) return;
        sessionRef.current = { category: 'earrings', path: earringsModel, earrings: three };
        mountEarringPair(three, earringsModel, gen, loadGenRef, (error) => onErrorRef.current?.(error));

        const cylinderRadius = 2;
        const cylinderHeight = 0.5;
        const cylinderOffset = [0, 1, 0];
        const cylinderEuler = [0, Math.PI / 6, Math.PI / 2];

        const occluderGeom = new window.THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight);
        const matrix = new window.THREE.Matrix4().makeRotationFromEuler(new window.THREE.Euler().fromArray([...cylinderEuler, 'XYZ']));
        matrix.setPosition(new window.THREE.Vector3().fromArray(cylinderOffset));
        occluderGeom.applyMatrix4(matrix);

        window.WebARRocksFaceEarrings3DHelper.add_threeEarsOccluders(occluderGeom);
        const markOccluders = (node: any) => {
          node?.children?.forEach((child: any) => {
            if (child.material && child.material.colorWrite === false) child.userData.isOccluder = true;
          });
        };
        markOccluders(three.earringRight);
        markOccluders(three.earringLeft);

        const syncEarrings = (cssW: number, cssH: number) => {
          const px = viewPixelSize({ w: cssW, h: cssH });
          window.WebARRocksFaceEarrings3DHelper?.resize(px.w, px.h);
        };
        resizeTrackerRef.current = syncEarrings;
        const sized = readViewCssSize(canvasFaceRef.current);
        if (sized) syncEarrings(sized.w, sized.h);

        if (isMounted && gen === loadGenRef.current) {
          setIsLoaded(true);
          setIsPaused(false);
          updateStatus('tracking', 'Tracking Face');
        }

      } catch (e: any) {
        if (isMounted) {
          onErrorRef.current?.(e);
          updateStatus('error', e.message);
        }
      }
    };

    const initHand = async () => {
      if (!window.HandTrackerThreeHelper) return;

      let nnPaths = [''];
      let modelURL = '';
      let occluderURL = '';
      let poseLandmarksLabels: string[] = [];
      let modelOffset = [0, 0, 0];
      let modelQuaternion = [0, 0, 0, 1];
      let modelScale = 1;

      if (category === 'ring') {
        nnPaths = ['/webar/neuralNets/NN_RING_14.json'];
        if (modelConfig?.modelPath) {
          modelURL = modelConfig.modelPath;
          if (modelConfig.occluderPath) occluderURL = modelConfig.occluderPath;
          if (modelConfig.modelScale != null) modelScale = modelConfig.modelScale;
          if (modelConfig.modelOffset) modelOffset = modelConfig.modelOffset;
          if (modelConfig.modelQuaternion) modelQuaternion = modelConfig.modelQuaternion;
        } else {
          modelURL = '/webar/assets/ring/ringPlaceHolder2.glb';
          occluderURL = '/webar/assets/ring/ringOccluder2.glb';
          modelScale = 0.421;
          modelOffset = [-1.66, -11.91, 0.26];
          modelQuaternion = [0.258, 0.016, -0.005, 0.966];
        }
        poseLandmarksLabels = ["ringBack", "ringLeft", "ringRight", "ringPalm", "ringPalmTop", "ringBackTop", "ringBase0", "ringBase1", "ringMiddleFinger", "ringPinkyFinger", "ringBasePalm"];
      } else if (category === 'watch') {
        nnPaths = ['/webar/neuralNets/NN_WRIST_27.json'];
        if (modelConfig?.modelPath) {
          modelURL = modelConfig.modelPath;
          if (modelConfig.occluderPath) occluderURL = modelConfig.occluderPath;
          if (modelConfig.modelScale != null) modelScale = modelConfig.modelScale;
          if (modelConfig.modelOffset) modelOffset = modelConfig.modelOffset;
          if (modelConfig.modelQuaternion) modelQuaternion = modelConfig.modelQuaternion;
        } else {
          modelURL = '/webar/assets/watch/watchCasio.glb';
          occluderURL = '/webar/assets/watch/wristOccluder.glb';
          modelScale = 1.35 * 1.462;
          modelOffset = [0.076, -0.916, -0.504];
          modelQuaternion = [0, 0, 0, 1];
        }
        poseLandmarksLabels = ["wristBack", "wristLeft", "wristRight", "wristPalm", "wristPalmTop", "wristBackTop", "wristRightBottom", "wristLeftBottom"];
      }

      const gen = ++loadGenRef.current;
      try {
        const three = await window.HandTrackerThreeHelper.init({
          handTrackerCanvas: canvasFaceRef.current,
          VTOCanvas: canvasThreeRef.current,
          NNsPaths: nnPaths,
          threshold: 0.9,
          poseLandmarksLabels,
          objectPointsPositionFactors: [1.0, 1.0, 1.0],
          poseFilter: (window.PoseFlipFilter) ? window.PoseFlipFilter.instance({}) : null,
          landmarksStabilizerSpec: {
            minCutOff: 0.001,
            beta: category === 'ring' ? 30 : 5
          },
          taaLevel: TAA_LEVEL,
          bloom: BLOOM_BY_CATEGORY[category],
          videoSettings: {
            facingMode: cameraMode
          }
        });
        threeInstance = three;

        const scene = three.scene;
        const hemiLight = new window.THREE.HemisphereLight(0xffffff, 0x000000, 2);
        scene.add(hemiLight);
        const pointLight = new window.THREE.PointLight(0xffffff, 2);
        pointLight.position.set(0, 100, 0);
        scene.add(pointLight);

        const dracoLoader = new (window as any).THREE.DRACOLoader();
        dracoLoader.setDecoderPath('/webar/libs/three/v136/examples/js/libs/draco/');
        const gltfLoader = new (window as any).THREE.GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        if (occluderURL) {
          gltfLoader.load(
            occluderURL,
            (model: any) => {
              const me = model.scene.children[0];
              me.material = new window.THREE.MeshNormalMaterial({ colorWrite: false });
              window.HandTrackerThreeHelper.add_threeOccluder(me);
              console.log('WebAR: Loaded hand occluder:', occluderURL);
            },
            undefined,
            (err: any) => console.error('WebAR: Failed to load hand occluder:', occluderURL, err)
          );
        }

        mountHandAccessory(
          modelURL,
          {
            modelPath: modelURL,
            modelScale,
            modelOffset: modelOffset as [number, number, number],
            modelQuaternion: modelQuaternion as [number, number, number, number],
            applyHandPlacement: modelConfig?.applyHandPlacement,
          },
          gen,
          loadGenRef,
          handModelRef,
          (error) => onErrorRef.current?.(error),
        );

        if (isMounted && gen === loadGenRef.current) {
          sessionRef.current = { category, path: modelURL };
          setIsLoaded(true);
          setIsPaused(false);
          const syncHand = (cssW: number, cssH: number) => {
            const px = viewPixelSize({ w: cssW, h: cssH });
            window.HandTrackerThreeHelper?.resize(px.w, px.h);
          };
          resizeTrackerRef.current = syncHand;
          const sized = readViewCssSize(canvasFaceRef.current);
          if (sized) syncHand(sized.w, sized.h);
          updateStatus('tracking', category === 'ring' ? 'Tracking Ring' : 'Tracking Watch');
        }
      } catch (e: any) {
        if (isMounted) {
          onErrorRef.current?.(e);
          updateStatus('error', e.message);
        }
      }
    };

    // QUEUEING SYSTEM: Simple queue: always wait for previous promise
    const enqueue = (task: () => Promise<void>) => {
      globalSequence = globalSequence.then(task).catch(e => console.error("Queue error:", e));
    };

    // Main start logic execution
    enqueue(async () => {
      if (!isMounted) return;
      try {
        updateStatus('loading', 'Initializing...');
        // Wait for scripts
        if ((window as any).__webarScriptsReady === false) {
          throw new Error("Scripts failed to load. Check browser console for details.");
        }
        await waitFor(() => (window as any).__webarScriptsReady === true, "ScriptLoader Ready");
        if (!isMounted) return;

        // Globals Check
        if (category === 'necklace' || category === 'glasses' || category === 'hat') {
          await waitFor(() => !!window.THREE && !!window.WEBARROCKSFACE && !!window.WebARRocksFaceThreeHelper && !!window.WebARRocksMirror, "Face/Mirror Globals");
          if (!isMounted) return;
          updateStatus('loading', 'Starting camera (Face)...');
          await initFaceMirror();
        } else if (category === 'earrings') {
          await waitFor(() => !!window.THREE && !!window.WEBARROCKSFACE && !!window.WebARRocksFaceEarrings3DHelper && !!window.WebARRocksResizer, "Earrings Globals");
          if (!isMounted) return;
          updateStatus('loading', 'Starting camera (Earrings)...');
          await startEarrings();
        } else if (category === 'ring' || category === 'watch') {
          await waitFor(() => !!window.THREE && !!window.WEBARROCKSHAND && !!window.HandTrackerThreeHelper && !!window.PoseFlipFilter, "Hand Globals");
          if (!isMounted) return;
          updateStatus('loading', 'Starting camera (Hand)...');
          await initHand();
        }
      } catch (e: any) {
        if (isMounted) {
          updateStatus('error', `Start failed: ${e.message}`);
          onErrorRef.current?.(e);
        }
      }
    });

    return () => {
      isMounted = false;
      handModelRef.current = null;
      sessionRef.current = null;
      resizeTrackerRef.current = null;
      loadGenRef.current += 1;
      if (pollTimer) clearInterval(pollTimer);

      enqueue(async () => {
        updateStatus('loading', 'Cleaning up...');
        try {
          await doDestroy();
        } catch (e) {
          console.error("Cleanup failed", e);
        }
      });
    };
    // Intentionally exclude modelConfig?.modelPath: changing product (same category) must not
    // tear down and re-init the camera, which would cause a visible reset/flicker.
  }, [category, cameraMode, isHandMode]);

  useEffect(() => {
    const path = modelConfig?.modelPath;
    const session = sessionRef.current;
    if (!path || !isLoaded || !session) return;
    if (session.category !== category || session.path === path) return;

    const gen = ++loadGenRef.current;
    session.path = path;

    if (category === 'glasses' || category === 'necklace' || category === 'hat') {
      window.WebARRocksMirror?.load(path);
      return;
    }
    if (category === 'earrings' && session.earrings) {
      mountEarringPair(session.earrings, path, gen, loadGenRef, (error) => onErrorRef.current?.(error));
      return;
    }
    if (category === 'ring' || category === 'watch') {
      mountHandAccessory(path, modelConfig, gen, loadGenRef, handModelRef, (error) => onErrorRef.current?.(error));
    }
  }, [modelConfig?.modelPath, category, isLoaded]);

  // Apply transform overrides to hand model every frame so they persist over SDK updates
  useEffect(() => {
    if (!isHandMode || !window.THREE) return;
    const overrides = transformOverrides ?? {};
    let rafId: number;
    const tick = () => {
      const data = handModelRef.current;
      if (!data?.mesh) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const mesh = data.mesh;
      const scale = (overrides.scale ?? 1) * data.baseScale;
      mesh.scale.setScalar(scale);
      const height = overrides.height ?? 0;
      const depth = overrides.depth ?? 0;
      mesh.position.set(
        data.basePosition[0],
        data.basePosition[1] + height * 0.05,
        data.basePosition[2] + depth * 0.02
      );
      const rotRad = (overrides.rotation ?? 0) * (Math.PI / 180);
      const baseQ = new window.THREE.Quaternion(
        data.baseQuaternion[0],
        data.baseQuaternion[1],
        data.baseQuaternion[2],
        data.baseQuaternion[3]
      );
      const zRotQ = new window.THREE.Quaternion().setFromEuler(new window.THREE.Euler(0, 0, rotRad));
      mesh.quaternion.copy(baseQ).premultiply(zRotQ);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isHandMode, transformOverrides?.scale, transformOverrides?.height, transformOverrides?.rotation, transformOverrides?.depth]);

  useEffect(() => {
    const el = canvasFaceRef.current?.parentElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const size = readViewCssSize(el);
      if (!size) return;
      resizeTrackerRef.current?.(size.w, size.h);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasFaceRef}
        className="vto-viewfinder"
        style={{
          transform: (isHandMode || cameraMode === 'environment') ? 'none' : 'scaleX(-1)',
          zIndex: 0,
        }}
        id="WebARRocksFaceCanvas"
      />
      <canvas
        ref={canvasThreeRef}
        className="vto-viewfinder"
        style={{
          transform: (isHandMode || cameraMode === 'environment') ? 'none' : 'scaleX(-1)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        id="threeCanvas"
      />
    </div>
  );
});

export default TryOnCanvas;
