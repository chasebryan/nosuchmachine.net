import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const book = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/book" }),
  schema: z.object({
    title: z.string(),
    part: z.string(),
    order: z.number().int().nonnegative(),
    description: z.string(),
  }),
});

export const collections = { book };
