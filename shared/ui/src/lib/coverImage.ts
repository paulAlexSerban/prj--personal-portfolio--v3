export const ASSET_BASE_URL = "https://paulserban.eu/assets";

/** Resolve a post cover to a render URL; falls back to a placeholder when unset. */
export function coverImageUrl(
  cover: string | null | undefined,
  placeholder: string,
): string {
  const c = cover?.trim();
  if (!c) return placeholder;
  if (/^https?:\/\//.test(c) || c.startsWith("/")) return c;
  return `${ASSET_BASE_URL}/${c.replace(/^\/+/, "")}`;
}
