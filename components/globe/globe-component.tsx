"use client";

import { useEffect, useRef, forwardRef } from 'react';
import ReactGlobe from 'react-globe.gl';
import * as THREE from 'three';
import { useTheme } from "next-themes";

interface GlobeProps {
  globeRef: any;
  [key: string]: any;
}

const GlobeComponent = forwardRef<any, GlobeProps>(({ globeRef, ...props }, _ref) => {
  const { theme } = useTheme();
  const localRef = useRef<any>();

  useEffect(() => {
    if (localRef.current) {
      // Assign methods to the external ref
      if (globeRef) {
        globeRef.current = {
          scene: () => localRef.current?.scene(),
          controls: () => localRef.current?.controls(),
          renderer: () => localRef.current?.renderer(),
          pointOfView: (params: any, duration: number) => localRef.current?.pointOfView(params, duration)
        };
      }

      const scene = localRef.current.scene();
      const controls = localRef.current.controls();

      // Configure lighting
      const existingLights = scene.children.filter((child: THREE.Object3D) => 
        child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight
      );
      existingLights.forEach((light) => scene.remove(light));
      
      // Adjust lighting based on theme
      const ambientIntensity = theme === 'dark' ? 0.3 : 0.6;
      const directionalIntensity = theme === 'dark' ? 0.4 : 0.8;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Configure controls
      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 120;
        controls.maxDistance = 500;
        controls.enablePan = true;
        controls.panSpeed = 0.5;
        controls.autoRotate = false;
      }

      // Set renderer properties
      const renderer = localRef.current.renderer();
      if (renderer) {
        renderer.setClearColor(0x000000, 0);
        renderer.alpha = true;
        renderer.toneMappingExposure = theme === 'dark' ? 0.5 : 0.8;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      // Ensure transparent background
      const domElement = renderer?.domElement;
      if (domElement) {
        domElement.style.background = 'transparent';
      }
      scene.background = null;

      // Animation loop with transparency maintenance
      let animationFrame: number;
      const animate = () => {
        animationFrame = requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer) {
          renderer.setClearColor(0x000000, 0);
        }
      };
      animate();

      return () => {
        cancelAnimationFrame(animationFrame);
        existingLights.forEach((light) => scene.remove(light));
      };
    }
  }, [globeRef, theme]);

  return (
    <div className="w-full h-full" style={{ background: 'transparent' }}>
      <ReactGlobe 
        ref={localRef}
        {...props}
        backgroundColor="rgba(0,0,0,0)"
      />
    </div>
  );
});

GlobeComponent.displayName = 'GlobeComponent';

export default GlobeComponent;