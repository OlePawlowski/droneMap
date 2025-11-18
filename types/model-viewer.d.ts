// Global JSX typing for the custom <model-viewer> web component
// Ensures TS recognizes the intrinsic element across the app

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
        'camera-orbit'?: string;
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'camera-target'?: string;
        'tone-mapping'?: string;
        'skybox-image'?: string;
      }, HTMLElement>;
    }
  }
}

export {};






