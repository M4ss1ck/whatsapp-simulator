/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTION_API_URL?: string;
  readonly VITE_REMOTION_COMPOSITION_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
