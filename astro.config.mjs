// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import { readdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { optimizeImages, responsive } from './src/lib/images.mjs';

const BASE = '/breadboard';

/**
 * Markdown authors write root-relative paths (`![](/projects/x/y.jpg)`,
 * `[link](/projects/hawklights)`). Astro leaves those alone, which breaks
 * under a deploy `base`, so prefix them at build time.
 */
function rehypeBasePaths() {
  const attrFor = { a: 'href', img: 'src', video: 'src', source: 'src' };
  return (tree) => {
    const visit = (node) => {
      const attr = node.type === 'element' ? attrFor[node.tagName] : undefined;
      if (attr) {
        const value = node.properties?.[attr];
        if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
          node.properties[attr] = `${BASE}${value}`;
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

/**
 * Swap markdown `![](/projects/x/y.png)` for its resized WebP variants (see
 * src/lib/images.mjs). Runs before rehypeBasePaths, which prefixes `src`;
 * `srcset` is prefixed here. The first image is likely the LCP, so only the
 * rest are lazy.
 */
function rehypeResponsiveImages() {
  return async (tree) => {
    const imgs = [];
    const visit = (node) => {
      if (node.type === 'element' && node.tagName === 'img') imgs.push(node);
      node.children?.forEach(visit);
    };
    visit(tree);
    await Promise.all(imgs.map(async (node, i) => {
      const src = node.properties?.src;
      if (typeof src !== 'string') return;
      const r = await responsive(src);
      if (r.srcset) {
        node.properties.src = r.src;
        node.properties.srcSet = r.srcset.replace(/(^|, )\//g, `$1${BASE}/`);
        node.properties.sizes = '(max-width: 800px) 100vw, 760px';
        node.properties.width = r.width;
        node.properties.height = r.height;
      }
      node.properties.decoding = 'async';
      if (i > 0) node.properties.loading = 'lazy';
    }));
  };
}

/**
 * Generates the image variants before dev/build, and keeps the multi-MB
 * originals out of the deploy when no built page links to them.
 */
function responsiveImages() {
  return {
    name: 'responsive-images',
    hooks: {
      'astro:config:setup': async ({ logger }) => {
        const n = await optimizeImages(undefined, (m) => logger.warn(m));
        if (n) logger.info(`generated ${n} image variants`);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const files = await readdir(out, { recursive: true });
        const html = (await Promise.all(
          files.filter((f) => f.endsWith('.html')).map((f) => readFile(`${out}/${f}`, 'utf8')),
        )).join('\n');
        let dropped = 0;
        for (const f of files) {
          const isImage = /\.(png|jpe?g)$/i.test(f);
          // raw phone/screen videos: .mov/.m4v, or a plain .mp4 that has a .web.mp4 cut
          const isVideo = /\.(mov|m4v)$/i.test(f) || (/\.mp4$/i.test(f) && !/\.web\.mp4$/i.test(f));
          if (!isImage && !isVideo) continue;
          const name = f.split('/').pop();
          const hasVariant = isImage
            ? files.includes(f.replace(/\.(png|jpe?g)$/i, '.1600w.webp'))
            : files.includes(f.replace(/\.(mov|m4v|mp4)$/i, '.web.mp4'))
              || files.includes(f.replace(/\.(mov|m4v|mp4)$/i, '-1.web.mp4')); // cut into parts
          if (hasVariant && !html.includes(name)) {
            await rm(`${out}/${f}`);
            dropped++;
          }
        }
        if (dropped) logger.info(`dropped ${dropped} unreferenced full-size originals from the build`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://farhanj2.github.io',
  base: BASE,
  integrations: [responsiveImages(), mdx()],
  markdown: {
    rehypePlugins: [rehypeResponsiveImages, rehypeBasePaths],
  },
});
