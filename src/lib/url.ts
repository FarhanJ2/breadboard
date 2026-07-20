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
