/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional. Derived from the page's own host when unset — see config/api-base-url.ts */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PORT?: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_CUSTOMER_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
