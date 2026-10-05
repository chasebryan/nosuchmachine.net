import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const lesson = z.object({
  title: z.string(),
  part: z.string(),
  order: z.number().int().nonnegative(),
  description: z.string(),
});
const book = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/book" }),
  schema: lesson,
});
const study = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/study" }),
  schema: lesson,
});

export const collections = { book, study };
