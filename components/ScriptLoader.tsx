'use client';

import { useEffect, useState } from 'react';

export default function ScriptLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        // already loaded:
        if (document.querySelector(`script[data-webar-src="${src}"]`)) {
          resolve();
          return;
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = false; // preserve execution order
        s.defer = true;
        s.dataset.webarSrc = src;
        s.onload = () => {
          resolve();
        };
        s.onerror = () => {
          reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(s);
      });

    (async () => {
      try {
        console.log('WebAR: Starting script loading...');
        // THREE + loaders:
        await loadScript('/webar/libs/three/v136/build/three.min.js');
        console.log('WebAR: Three.js loaded');
        await loadScript('/webar/libs/three/v136/examples/js/loaders/GLTFLoader.js');
        await loadScript('/webar/libs/three/v136/examples/js/loaders/RGBELoader.js');
        await loadScript('/webar/libs/three/v136/examples/js/loaders/DRACOLoader.js');
        console.log('WebAR: Three.js loaders loaded');

        // Postprocessing (used by helpers for TAA/bloom):
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/EffectComposer.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/ShaderPass.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/RenderPass.js');
        await loadScript('/webar/libs/three/v136/examples/js/shaders/CopyShader.js');
        await loadScript('/webar/libs/three/v136/examples/js/shaders/LuminosityHighPassShader.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/UnrealBloomPassTweaked.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/SSAARenderPass.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/TAARenderPass.js');
        console.log('WebAR: Three.js postprocessing loaded');

        // Common helpers:
        await loadScript('/webar/helpers/landmarksStabilizers/OneEuroLMStabilizer.js');
        await loadScript('/webar/helpers/WebARRocksResizer.js');
        console.log('WebAR: Common helpers loaded');

        // Face SDK + helpers:
        await loadScript('/webar/dist/WebARRocksFace.js');
        await loadScript('/webar/helpers/WebARRocksFaceThreeHelper.js');
        await loadScript('/webar/helpers/WebARRocksMirror.js');
        await loadScript('/webar/helpers/WebARRocksFaceEarrings3DHelper.js');
        console.log('WebAR: Face SDK loaded');

        // Hand SDK + helpers:
        await loadScript('/webar/dist/WebARRocksHand.js');
        await loadScript('/webar/helpers/PoseFlipFilter.js');
        await loadScript('/webar/helpers/HandTrackerThreeHelper.js');
        console.log('WebAR: Hand SDK loaded');

        // Mark ready:
        (window as any).__webarScriptsReady = true;
        console.log('WebAR: All scripts loaded successfully');
        if (isMounted) setReady(true);
      } catch (e) {
        console.error('WebAR script loading failed:', e);
        (window as any).__webarScriptsReady = false;
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // optional: expose a tiny invisible marker for debugging
  return <span data-webar-ready={ready ? '1' : '0'} style={{ display: 'none' }} />;
}

