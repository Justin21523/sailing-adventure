/// <reference types="vite/client" />

/**
 * Global type declarations for non-TS assets and environment variables.
 * Required for strict TS compilation when importing binary assets.
 */

// 3D Model Extensions
declare module '*.glb' {
  const src: string;
  export default src;
}

declare module '*.gltf' {
  const src: string;
  export default src;
}

// Texture Extensions
declare module '*.hdr' {
  const src: string;
  export default src;
}

declare module '*.ktx2' {
  const src: string;
  export default src;
}

declare module '*.basis' {
  const src: string;
  export default src;
}

// Audio Extensions
declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}

// WASM Modules (Draco/KTX2 decoders)
declare module '*.wasm' {
  const src: string;
  export default src;
}

// Vite Environment Variables
interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string;
  readonly VITE_ENABLE_DEBUG_UI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}