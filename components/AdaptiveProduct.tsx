'use client';

import { useEffect, useRef } from 'react';

type Category = 'necklace' | 'earrings' | 'glasses' | 'hat' | 'ring' | 'watch';

interface AdaptiveProductProps {
  category: Category;
  headRotation?: { x: number; y: number; z: number };
  handMovement?: { x: number; y: number };
  ambientLight?: number; // 0-1
  onAnimationUpdate?: (params: any) => void;
}

interface PhysicsState {
  velocity: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

export default function AdaptiveProduct({
  category,
  headRotation,
  handMovement,
  ambientLight = 0.5,
  onAnimationUpdate,
}: AdaptiveProductProps) {
  const physicsStateRef = useRef<PhysicsState>({
    velocity: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  });
  const previousHeadRotationRef = useRef(headRotation);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // seconds
      lastUpdateTimeRef.current = now;

      const state = physicsStateRef.current;
      const damping = 0.92; // Damping factor for smooth deceleration

      // Category-specific physics
      switch (category) {
        case 'necklace':
          if (headRotation && previousHeadRotationRef.current) {
            // Calculate head rotation delta
            const deltaY = headRotation.y - previousHeadRotationRef.current.y;

            // Apply pendulum physics for sway
            const swayForce = deltaY * 2.0; // Amplify rotation for visible effect
            state.velocity.x += swayForce;

            // Apply damping
            state.velocity.x *= damping;

            // Update position
            state.position.x += state.velocity.x * deltaTime;

            // Clamp position to prevent extreme swaying
            state.position.x = Math.max(-0.3, Math.min(0.3, state.position.x));

            // Apply gravity pull back to center
            const restoreForce = -state.position.x * 0.5;
            state.velocity.x += restoreForce;
          }
          break;

        case 'glasses':
          if (headRotation) {
            // Glasses tilt with head movement (direct mapping with slight lag)
            const targetRotationX = headRotation.x * 0.8;
            const targetRotationZ = headRotation.z * 0.6;

            // Smooth interpolation
            state.rotation.x += (targetRotationX - state.rotation.x) * 0.15;
            state.rotation.z += (targetRotationZ - state.rotation.z) * 0.15;
          }
          break;

        case 'earrings':
          if (headRotation && previousHeadRotationRef.current) {
            // Earrings swing with head movement
            const deltaX = headRotation.x - previousHeadRotationRef.current.x;
            const deltaZ = headRotation.z - previousHeadRotationRef.current.z;

            // Apply swing force
            state.velocity.y += deltaX * 1.5;
            state.velocity.z += deltaZ * 1.5;

            // Damping
            state.velocity.y *= damping;
            state.velocity.z *= damping;

            // Update position
            state.position.y += state.velocity.y * deltaTime;
            state.position.z += state.velocity.z * deltaTime;

            // Restore to center
            state.velocity.y += -state.position.y * 0.4;
            state.velocity.z += -state.position.z * 0.4;
          }
          break;

        case 'ring':
          if (handMovement) {
            // Ring catches light with finger movement
            const lightAngle = Math.atan2(handMovement.y, handMovement.x);
            state.rotation.z = lightAngle;

            // Subtle rotation based on movement speed
            const movementSpeed = Math.sqrt(handMovement.x ** 2 + handMovement.y ** 2);
            state.rotation.y += movementSpeed * 0.01;
          }
          break;

        case 'watch':
          if (handMovement) {
            // Watch strap flexes with wrist movement
            const flexAmount = handMovement.y * 0.05;
            state.position.y = flexAmount;

            // Smooth interpolation
            state.position.y += (flexAmount - state.position.y) * 0.1;
          }
          break;

        case 'hat':
          if (headRotation) {
            // Hat tilts with head but with slight delay
            const targetRotationX = headRotation.x * 0.9;
            const targetRotationZ = headRotation.z * 0.9;

            state.rotation.x += (targetRotationX - state.rotation.x) * 0.12;
            state.rotation.z += (targetRotationZ - state.rotation.z) * 0.12;
          }
          break;
      }

      // Update previous rotation
      previousHeadRotationRef.current = headRotation;

      // Calculate lighting parameters based on ambient light
      const highlightIntensity = 0.3 + (ambientLight * 0.7);
      const shadowSoftness = 0.2 + (ambientLight * 0.3);
      const reflectionIntensity = 0.4 + (ambientLight * 0.6);

      // Notify parent component with animation parameters
      if (onAnimationUpdate) {
        onAnimationUpdate({
          position: { ...state.position },
          rotation: { ...state.rotation },
          lighting: {
            highlightIntensity,
            shadowSoftness,
            reflectionIntensity,
            ambientLight,
          },
        });
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [category, headRotation, handMovement, ambientLight, onAnimationUpdate]);

  // This component doesn't render anything visible
  // It's a logic-only component that calculates physics and lighting
  return null;
}
