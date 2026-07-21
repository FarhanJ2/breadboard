import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    /** short project/codename shown large on the featured card */
    codename: z.string().optional(),
    date: z.coerce.date(),
    /** taxonomy: LOG (day-to-day), WRITEUP (deep dive), POSTMORTEM (retrospective) */
    tags: z.array(z.enum(["LOG", "WRITEUP", "POSTMORTEM"])).default(["LOG"]),
    teaser: z.string(),
    /** one concrete detail pulled onto the card face */
    stat: z.object({ value: z.string(), label: z.string() }).optional(),
    readMins: z.number().optional(),
    featured: z.boolean().default(false),
    pinned: z.boolean().default(false),
    /** badge for very recent posts */
    freshInk: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: () =>
    z.object({
      title: z.string(),
      codename: z.string(),
      blurb: z.string(),
      year: z.string(),
      status: z.enum(["shipped", "active", "research", "archived"]),
      /** groups the projects page: robot subsystems, standalone tools/research, or games */
      category: z.enum(["robot", "tools", "game-dev"]).default("robot"),
      tech: z.array(z.string()).default([]),
      stat: z.object({ value: z.string(), label: z.string() }).optional(),
      featured: z.boolean().default(false),
      /** lower sorts first */
      order: z.number().default(50),
      /**
       * Cover photo, shown on the featured hero, the grid card, and the writeup.
       * A root-relative path to a file in /public (e.g. "/projects/foo/cover.jpg");
       * withBase() adds the deploy base at render time.
       */
      cover: z.string().optional(),
      coverAlt: z.string().default(""),
      /** external links only — the project's own writeup lives at /projects/<slug> */
      links: z
        .object({
          github: z.string().url().optional(),
          docs: z.string().url().optional(),
          demo: z.string().url().optional(),
          /**
           * Any other labeled links — add as many as you want, e.g.
           *   more:
           *     - label: "workshop map"
           *       href: "https://steamcommunity.com/..."
           */
          more: z
            .array(z.object({ label: z.string(), href: z.string().url() }))
            .default([]),
        })
        .default({}),
    }),
});

export const collections = { blog, projects };
