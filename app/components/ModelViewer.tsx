"use client";

import { useEffect, useRef } from 'react';
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        'animation-name'?: string;
        autoplay?: boolean;
      }, HTMLElement>;
    }
  }
}

export default function ModelViewer() {
  const modelViewerRef = useRef<any>(null);

  useEffect(() => {
    // Google Model Viewer Script laden
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (modelViewerRef.current) {
      const modelViewer = modelViewerRef.current;
      
      const handleLoad = () => {
        console.log('Drohne erfolgreich geladen!');
        
        // Animationen manuell starten falls nötig
        if (modelViewer.availableAnimations && modelViewer.availableAnimations.length > 0) {
          console.log('Verfügbare Animationen:', modelViewer.availableAnimations);
          modelViewer.availableAnimations.forEach((animationName: string) => {
            modelViewer.play({ animationName: animationName, repetitions: Infinity });
          });
        }
      };

      const handleError = (event: any) => {
        console.error('Fehler beim Laden:', event);
      };

      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);

      return () => {
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
      };
    }
  }, []);

  return (
    // @ts-expect-error - model-viewer is a web component, not a standard React component
    <model-viewer
      ref={modelViewerRef}
      src="/result.gltf"
      alt="3D Drohne"
      auto-rotate
      camera-controls={false}
      shadow-intensity="1"
      environment-image="neutral"
      exposure="1.2"
      loading="eager"
      animation-name="*"
      autoplay
      style={{
        width: '200px',
        height: '200px',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    />
  );
}
