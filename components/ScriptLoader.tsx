'use client';

import { useEffect, useState } from 'react';

export default function ScriptLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const loaded = document.querySelector(`script[data-webar-src="${src}"][data-webar-loaded="1"]`);
        if (loaded) {
          resolve();
          return;
        }

        // A previous attempt may have left a dead tag. Drop it so we can retry.
        document.querySelectorAll(`script[data-webar-src="${src}"]`).forEach((node) => node.remove());

        const s = document.createElement('script');
        s.src = src;
        s.async = false; // preserve execution order
        s.dataset.webarSrc = src;
        s.onload = () => {
          s.dataset.webarLoaded = '1';
          resolve();
        };
        s.onerror = () => {
          s.remove();
          reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(s);
      });

    (async () => {
      try {
        console.log('WebAR: Starting script loading...');
        // UMD build. three.min.js is not in this project, and three.module.js
        // does not attach THREE to window when loaded as a classic script.
        await loadScript('/webar/libs/three/v136/build/three.js');
        console.log('WebAR: Three.js loaded');
        await loadScript('/webar/libs/three/v136/examples/js/loaders/GLTFLoader.js');
        await loadScript('/webar/libs/three/v136/examples/js/loaders/RGBELoader.js');
        await loadScript('/webar/libs/three/v136/examples/js/loaders/DRACOLoader.js');
        console.log('WebAR: Three.js loaders loaded');

        // CopyShader first. EffectComposer defines THREE.Pass and must run
        // before ShaderPass and RenderPass, which extend it. The composer
        // only needs ShaderPass when it is constructed, not when it loads.
        await loadScript('/webar/libs/three/v136/examples/js/shaders/CopyShader.js');
        await loadScript('/webar/libs/three/v136/examples/js/shaders/LuminosityHighPassShader.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/EffectComposer.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/ShaderPass.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/RenderPass.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/UnrealBloomPassTweaked.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/SSAARenderPass.js');
        await loadScript('/webar/libs/three/v136/examples/js/postprocessing/TAARenderPass.js');

        const THREE = (window as any).THREE;
        const missing = [
          ['THREE', THREE],
          ['CopyShader', THREE?.CopyShader],
          ['ShaderPass', THREE?.ShaderPass],
          ['RenderPass', THREE?.RenderPass],
          ['EffectComposer', THREE?.EffectComposer],
          ['UnrealBloomPass', THREE?.UnrealBloomPass],
          ['SSAARenderPass', THREE?.SSAARenderPass],
          ['TAARenderPass', THREE?.TAARenderPass],
          ['GLTFLoader', THREE?.GLTFLoader],
          ['RGBELoader', THREE?.RGBELoader],
          ['DRACOLoader', THREE?.DRACOLoader],
        ].filter(([, value]) => !value).map(([name]) => name);

        if (missing.length) {
          throw new Error(`Postprocessing scripts loaded but missing: ${missing.join(', ')}`);
        }
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

