// The `lib/common` subpath (curated ~37-language build) ships without its own
// type declarations; reuse the package's public API surface.
declare module "highlight.js/lib/common" {
  import type { HLJSApi } from "highlight.js";
  const hljs: HLJSApi;
  export default hljs;
}
