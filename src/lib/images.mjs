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
 *
 * Phone videos get the same treatment: `clip.MOV` → `clip.web.mp4` (H.264,
 * ≤1280 wide, no audio, faststart) plus `clip.poster.jpg`, which then gets its
 * own WebP variants like any other image. Those two are committed rather than
 * gitignored, because CI may not have ffmpeg; without it the transcode step is
 * skipped and the committed files are used as-is.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const WIDTHS = [800, 1600];
const SOURCE_EXT = /\.(png|jpe?g)$/i;
const VIDEO_SRC_EXT = /\.(mov|m4v)$/i;

const publicDir = () => path.join(process.cwd(), "public");

/** `/projects/x/foo.png` → `/projects/x/foo.800w.webp` */
export function variantPath(publicPath, width) {
  return publicPath.replace(SOURCE_EXT, `.${width}w.webp`);
}

/** `/projects/x/clip.MOV` → `/projects/x/clip.web.mp4` / `clip.poster.jpg` */
export const webVideoPath = (p) => p.replace(VIDEO_SRC_EXT, ".web.mp4");
export const posterPath = (p) => p.replace(/\.(mov|m4v|mp4)$/i, "").replace(/\.web$/, "") + ".poster.jpg";

async function* walk(dir, ext) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full, ext);
    else if (ext.test(entry.name)) yield full;
  }
}

const stale = (out, srcTime) => !existsSync(out) || statSync(out).mtimeMs < srcTime;
let hasFfmpeg;
const ffmpeg = (args) => spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" }).status === 0;

/** Transcode phone videos for the web. Returns how many files were written. */
async function optimizeVideos(dir, warn) {
  let written = 0;
  for await (const src of walk(dir, VIDEO_SRC_EXT)) {
    const srcTime = statSync(src).mtimeMs;
    const mp4 = webVideoPath(src), poster = posterPath(src);
    if (!stale(mp4, srcTime) && !stale(poster, srcTime)) continue;
    hasFfmpeg ??= spawnSync("ffmpeg", ["-version"]).status === 0;
    if (!hasFfmpeg) {
      if (!existsSync(mp4)) warn(`ffmpeg not found — can't transcode ${path.basename(src)}`);
      continue;
    }
    // even dimensions are required by yuv420p; -an drops audio (these play muted)
    if (stale(mp4, srcTime) && ffmpeg([
      "-i", src, "-map", "0:v:0", "-an",
      "-vf", "scale='min(1280,iw)':-2,format=yuv420p",
      "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-profile:v", "high",
      "-movflags", "+faststart", mp4,
    ])) written++;
    if (stale(poster, srcTime) && ffmpeg(["-ss", "0.5", "-i", src, "-frames:v", "1", "-q:v", "3", poster])) written++;
  }
  return written;
}

/** Generate any missing/stale variants. Returns how many files were written. */
export async function optimizeImages(dir = publicDir(), warn = console.warn) {
  // videos first: their posters are images that need variants too
  let written = await optimizeVideos(dir, warn);
  for await (const src of walk(dir, SOURCE_EXT)) {
    const srcTime = statSync(src).mtimeMs;
    for (const width of WIDTHS) {
      const out = variantPath(src, width);
      if (!stale(out, srcTime)) continue;
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

/**
 * Everything in a public folder that can go in a showcase, in filename order:
 * phone videos (as their web transcode + poster), plain MP4s, and images.
 * Generated files (variants, transcodes, posters) are skipped as sources.
 * @param {string} publicDirPath e.g. "/projects/frc-reefscape-2025"
 * @returns {{ type: "video" | "image", src: string, poster?: string, file: string }[]}
 */
export function discoverMedia(publicDirPath) {
  const abs = path.join(publicDir(), publicDirPath);
  if (!existsSync(abs)) return [];
  const names = readdirSync(abs).filter((n) => !n.startsWith("."));
  const has = (n) => names.includes(n);
  const out = [];
  for (const name of names.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const rel = `${publicDirPath}/${name}`;
    if (/\.(\d+w\.webp|web\.mp4|poster\.jpg)$/i.test(name)) continue;
    if (VIDEO_SRC_EXT.test(name)) {
      const mp4 = webVideoPath(name);
      if (!has(mp4)) continue; // not transcoded (no ffmpeg) — nothing playable
      const poster = posterPath(name);
      out.push({ type: "video", src: `${publicDirPath}/${mp4}`, poster: has(poster) ? `${publicDirPath}/${poster}` : undefined, file: name });
    } else if (/\.mp4$/i.test(name)) {
      const poster = posterPath(name);
      out.push({ type: "video", src: rel, poster: has(poster) ? `${publicDirPath}/${poster}` : undefined, file: name });
    } else if (SOURCE_EXT.test(name) || /\.webp$/i.test(name)) {
      out.push({ type: "image", src: rel, file: name });
    }
  }
  return out;
}
