import { responsive } from "./images.mjs";

/**
 * Site-root-relative URLs need the deploy `base` ("/breadboard") in front of
 * them on GitHub Pages, but nothing extra in dev. Everything internal — links,
 * files served straight out of /public — goes through here.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

export function withBase(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${BASE}${path}`;
}

/**
 * `src` + `srcset` for a public image, base-prefixed, to spread onto an <img>.
 * Points at the resized WebP variants from ./images.mjs when they exist.
 */
export async function imageAttrs(path: string, sizes: string) {
  const { src, srcset } = await responsive(path);
  return {
    src: withBase(src),
    srcset: srcset?.replace(/(^|, )\//g, `$1${BASE}/`),
    sizes: srcset ? sizes : undefined,
  };
}
