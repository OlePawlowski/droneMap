// Global JSX typing for the custom <model-viewer> web component
// Ensures TS recognizes the intrinsic element across the app
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export {};






