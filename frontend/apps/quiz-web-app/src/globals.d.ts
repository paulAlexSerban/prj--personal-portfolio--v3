/** App version injected at build time from package.json (see vite.config.ts `define`). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_CF_BEACON_TOKEN?: string;
}
