// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

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

// https://astro.build/config
export default defineConfig({
  site: 'https://farhanj2.github.io',
  base: BASE,
  integrations: [mdx()],
  markdown: {
    rehypePlugins: [rehypeBasePaths],
  },
});
