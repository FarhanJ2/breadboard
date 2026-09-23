// @ts-check
/**
 * Responsive images for everything under /public.
 *
 * Source photos/renders are dropped into public/ at full resolution (4K
 * renders run 7–9 MB each). At dev/build start every PNG/JPEG gets resized
 * WebP siblings — `foo.png` → `foo.800w.webp`, `foo.1600w.webp` — and pages
 * reference those through `responsive()`, so phones pull ~100 KB instead of
 * ~8 MB. Authors keep writing the original path; the swap happens here.
 *
 * Variants are gitignored and regenerated when the source is newer.
 */
import { existsSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const WIDTHS = [800, 1600];
const SOURCE_EXT = /\.(png|jpe?g)$/i;

const publicDir = () => path.join(process.cwd(), "public");

/** `/projects/x/foo.png` → `/projects/x/foo.800w.webp` */
export function variantPath(publicPath, width) {
  return publicPath.replace(SOURCE_EXT, `.${width}w.webp`);
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SOURCE_EXT.test(entry.name)) yield full;
  }
}

/** Generate any missing/stale variants. Returns how many files were written. */
export async function optimizeImages(dir = publicDir()) {
  let written = 0;
  for await (const src of walk(dir)) {
    const srcTime = statSync(src).mtimeMs;
    for (const width of WIDTHS) {
      const out = variantPath(src, width);
      if (existsSync(out) && statSync(out).mtimeMs >= srcTime) continue;
      await sharp(src)
        .rotate() // respect EXIF orientation from phone photos
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80, alphaQuality: 90, effort: 5 })
        .toFile(out);
      written++;
    }
  }
  return written;
}

const metaCache = new Map();

/**
 * Attributes for a site-root-relative image path (no base prefix). Falls back
 * to the original path when there are no variants (SVGs, remote URLs, …).
 * @param {string} publicPath
 * @returns {Promise<{ src: string, srcset?: string, width?: number, height?: number }>}
 */
export async function responsive(publicPath) {
  if (!publicPath.startsWith("/") || !SOURCE_EXT.test(publicPath)) return { src: publicPath };
  const files = WIDTHS.map((w) => ({ w, rel: variantPath(publicPath, w) }));
  if (!files.every((f) => existsSync(path.join(publicDir(), f.rel)))) return { src: publicPath };

  const largest = files[files.length - 1].rel;
  let meta = metaCache.get(largest);
  if (!meta) {
    const { width, height } = await sharp(path.join(publicDir(), largest)).metadata();
    meta = { width, height };
    metaCache.set(largest, meta);
  }
  // withoutEnlargement caps small sources, so a variant can be narrower than
  // its name; srcset descriptors must be the real width. Drop duplicates.
  const seen = new Set();
  const srcset = files
    .map((f) => ({ rel: f.rel, w: Math.min(f.w, meta.width) }))
    .filter(({ w }) => !seen.has(w) && seen.add(w))
    .map(({ rel, w }) => `${rel} ${w}w`)
    .join(", ");
  return {
    src: largest,
    srcset,
    width: meta.width,
    height: meta.height,
  };
}
