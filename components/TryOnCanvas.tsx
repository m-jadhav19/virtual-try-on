'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

export type Category = 'necklace' | 'earrings' | 'glasses' | 'hat' | 'ring' | 'watch';

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
                  const dataURL = cv.toDataURL('image/png');
                  const win = window.open('');
                  if (win) {
                    win.document.write(`<img src="${dataURL}" style="max-width:100%;height:auto;" />`);
                  }
                  resolve(dataURL);
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
          const win = window.open('');
          if (win) {
            win.document.write(`<img src="${dataURL}" style="max-width:100%;height:auto;" />`);
          }
          return Promise.resolve(dataURL);
        } catch (e: any) {
          console.error("Capture error:", e);
          onError?.(e);
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
          onError?.(e);
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
          onError?.(e);
        }
      },
      flipCamera: async () => {
        try {
          const next = cameraMode === 'user' ? 'environment' : 'user';
          setCameraMode(next);
          // Re-init will happen via effect dependency (cameraMode)
          updateStatus('loading', 'Flipping camera...');
        } catch (e: any) {
          onError?.(e);
        }
      }
    }),
    [cameraMode, isHandMode, onError]
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
          if (!isMounted) return;
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
          // Use full-face NN (same as glasses) so default solve PnP labels (e.g. chin) exist.
          // NN_HEADPHONESL_2 does not have "chin" and would throw in WebARRocksFaceThreeHelper.
          nnPath = '/webar/neuralNets/NN_GLASSES_9.json';
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
        const initConfig: any = {
          canvasFace: canvasFaceRef.current,
          canvasThree: canvasThreeRef.current,
          width: window.innerWidth,
          height: window.innerHeight,
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
          taaLevel: 3,
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

        if (isMounted) {
          setIsLoaded(true);
          setIsPaused(false);
          window.WebARRocksMirror.resize(window.innerWidth, window.innerHeight);
          updateStatus('tracking', 'Tracking Face');
        }
      } catch (err: any) {
        if (isMounted) {
          onError?.(err);
          updateStatus('error', err.message);
        }
      }
    };

    const startEarrings = async () => {
      // ... (Logic kept roughly same, just consolidated inside queue execution)
      try {
        const three = await window.WebARRocksFaceEarrings3DHelper.init({
          NN: '/webar/neuralNets/NN_EARS_4.json',
          canvasFace: canvasFaceRef.current,
          canvasThree: canvasThreeRef.current,
          debugOccluder: false,
          taaLevel: 3
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
        const loader = new window.THREE.GLTFLoader();
        loader.load(earringsModel, (gltf: any) => {
          const model = gltf.scene;
          model.scale.multiplyScalar(100);
          model.traverse((child: any) => {
            if (child.isMesh) {
              child.material.roughness = 0.0;
              child.material.metalness = 1.0;
            }
          });
          three.earringRight.add(model);
          three.earringLeft.add(model.clone());
        });

        const cylinderRadius = 2;
        const cylinderHeight = 0.5;
        const cylinderOffset = [0, 1, 0];
        const cylinderEuler = [0, Math.PI / 6, Math.PI / 2];

        const occluderGeom = new window.THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight);
        const matrix = new window.THREE.Matrix4().makeRotationFromEuler(new window.THREE.Euler().fromArray([...cylinderEuler, 'XYZ']));
        matrix.setPosition(new window.THREE.Vector3().fromArray(cylinderOffset));
        occluderGeom.applyMatrix4(matrix);

        window.WebARRocksFaceEarrings3DHelper.add_threeEarsOccluders(occluderGeom);

        window.WebARRocksResizer.size_canvas({
          canvas: canvasFaceRef.current,
          overlayCanvas: [canvasThreeRef.current],
          callback: () => { },
          onResize: window.WebARRocksFaceEarrings3DHelper.resize
        });

        if (isMounted) {
          setIsLoaded(true);
          setIsPaused(false);
          updateStatus('tracking', 'Tracking Face');
        }

      } catch (e: any) {
        if (isMounted) {
          onError?.(e);
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

        if (occluderURL) {
          new window.THREE.GLTFLoader().load(occluderURL, (model: any) => {
            const me = model.scene.children[0];
            me.material = new window.THREE.MeshNormalMaterial({ colorWrite: false });
            window.HandTrackerThreeHelper.add_threeOccluder(me);
          });
        }

        new window.THREE.GLTFLoader().load(modelURL, (model: any) => {
          const me = model.scene.children[0];
          me.scale.set(1, 1, 1).multiplyScalar(modelScale);
          const d = modelOffset;
          const displacement = new window.THREE.Vector3(d[0], d[2], -d[1]);
          me.position.add(displacement);
          const q = modelQuaternion;
          me.quaternion.set(q[0], q[2], -q[1], q[3]);

          handModelRef.current = {
            mesh: me,
            baseScale: modelScale,
            basePosition: [me.position.x, me.position.y, me.position.z],
            baseQuaternion: [me.quaternion.x, me.quaternion.y, me.quaternion.z, me.quaternion.w],
          };
          window.HandTrackerThreeHelper.add_threeObject(me);
          if (isMounted) {
            setIsLoaded(true);
            setIsPaused(false);
            updateStatus('tracking', 'Tracking Hand');
          }
        });

      } catch (e: any) {
        if (isMounted) {
          onError?.(e);
          updateStatus('error', e.message);
        }
      }
    };

    // QUEUEING SYSTEM
    // We assume `globalSequence` would be defined at module scope, but to ensure hot-reload safety, 
    // we attach it to window or use a mutable ref if this was a singleton. 
    // Since this component re-renders, we need a true global.
    // We will use a window property or just a let outside the component (in the module).

    const enqueue = (task: () => Promise<void>) => {
      // Simple queue: always wait for previous promise
      globalSequence = globalSequence.then(task).catch(e => console.error("Queue error:", e));
    };

    // Main start logic
    enqueue(async () => {
      if (!isMounted) return; // if unmounted before we even started, abort

      try {
        updateStatus('loading', 'Initializing...');

        // NOTE: We do NOT need to wait for destroy here because the queue guarantees `destroy` (from previous effect) finished!

        updateStatus('loading', 'Loading scripts…');
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
          onError?.(e);
        }
      }
    });

    return () => {
      isMounted = false;
      handModelRef.current = null;
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
  }, [category, cameraMode, isHandMode, onError]);

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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasFaceRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: (isHandMode || cameraMode === 'environment')
            ? 'translate(-50%)'
            : 'translate(-50%) rotateY(180deg)',
          height: '100%',
          zIndex: 0,
        }}
        id='WebARRocksFaceCanvas'
      />
      <canvas
        ref={canvasThreeRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: (isHandMode || cameraMode === 'environment')
            ? 'translate(-50%)'
            : 'translate(-50%) rotateY(180deg)',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none'
        }}
        id='threeCanvas'
      />

      {/* 
          REMOVED OLD DEBUG OVERLAY 
          The status is now lifted up via onStatusChange
      */}
    </div>
  );
});

export default TryOnCanvas;
