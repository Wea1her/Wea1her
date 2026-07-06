import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

interface CompatContentData {
  routeSlug?: string | number;
  title?: string;
  description?: string;
  image?: string;
  heroImage?: string | { src?: string; alt?: string; color?: string };
  createdAt?: string | Date;
  publishDate?: string | Date;
  updatedAt?: string | Date;
  updatedDate?: string | Date;
  published?: boolean;
  draft?: boolean;
  type?: string;
  tags?: string[];
  language?: string;
  comment?: boolean;
  encrypted?: boolean;
  password?: string;
  projectUrl?: string;
  docUrl?: string;
  [key: string]: unknown;
}

function normalizePublicImageSrc(value?: string) {
  const src = value?.trim();
  if (!src) return undefined;
  if (/^(?:https?:)?\/\//u.test(src) || src.startsWith("/")) return src;

  const fileName = src.split("/").filter(Boolean).pop();
  if (src.startsWith("../images/") && fileName) return `/images/${fileName}`;

  return src;
}

const baseContentShape = {
  routeSlug: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  heroImage: z
    .union([
      z.string(),
      z.object({
        src: z.string().optional(),
        alt: z.string().optional(),
        color: z.string().optional(),
      }),
    ])
    .optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  publishDate: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  updatedDate: z.union([z.string(), z.date()]).optional(),
  published: z.boolean().optional(),
  draft: z.boolean().optional(),
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  comment: z.boolean().optional(),
  encrypted: z.boolean().optional(),
  password: z.string().optional(),
};

function withPureFrontmatterCompat(schema: z.ZodTypeAny) {
  return schema.transform((rawData) => {
    const data = rawData as CompatContentData;
    const heroImageSrc =
      typeof data.heroImage === "string" ? data.heroImage : data.heroImage?.src;
    const tags = Array.isArray(data.tags) ? data.tags : [];

    return {
      ...data,
      image: normalizePublicImageSrc(data.image ?? heroImageSrc),
      createdAt: data.createdAt ?? data.publishDate,
      updatedAt: data.updatedAt ?? data.updatedDate,
      published: data.published ?? data.draft !== true,
      type: data.type ?? tags[0] ?? data.language,
    } satisfies CompatContentData;
  });
}

const baseContentSchema = withPureFrontmatterCompat(
  z.looseObject(baseContentShape),
);

const projectSchema = withPureFrontmatterCompat(
  z.looseObject({
    ...baseContentShape,
    projectUrl: z.string().optional(),
    docUrl: z.string().optional(),
  }),
);

const pageSchema = z.object({
  title: z.string().min(1),
  heading: z.string().optional(),
  description: z.string().optional(),
  background: z
    .enum(["home", "code-rain", "constellation", "content"])
    .optional(),
  tocTitle: z.string().optional(),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: baseContentSchema,
});

const note = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/note" }),
  schema: baseContentSchema,
});

const project = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/project" }),
  schema: projectSchema,
});

const page = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/page" }),
  schema: pageSchema,
});

export const collections = {
  blog,
  note,
  project,
  page,
};
