import { z } from "zod";

const canonicalString = z
  .string()
  .refine((value) => value === value.trim(), "Leading or trailing whitespace is not allowed");
const nonEmptyString = canonicalString.min(1);
const safeIdentifierSchema = z
  .string()
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use a lowercase identifier containing only letters, numbers, and single hyphens",
  );
const projectSlugSchema = safeIdentifierSchema;
const uniqueNonEmptyStrings = (
  label: string,
  minimum: number,
  maximum: number,
) =>
  z
    .array(nonEmptyString.max(120))
    .min(minimum)
    .max(maximum)
    .superRefine((values, context) => {
      const seen = new Set<string>();
      values.forEach((value, index) => {
        if (seen.has(value)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate ${label} value "${value}".`,
            path: [index],
          });
        }
        seen.add(value);
      });
    });
const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM format");
const localPathBase = new URL("https://portfolio.invalid");
const rootRelativePathSchema = canonicalString.refine((value) => {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }

  try {
    return new URL(value, localPathBase).origin === localPathBase.origin;
  } catch {
    return false;
  }
}, "Use a root-relative local path");
const pdfPathSchema = rootRelativePathSchema.refine((value) => {
  try {
    return /\.pdf$/i.test(new URL(value, localPathBase).pathname);
  } catch {
    return false;
  }
}, "Use a PDF path");
const httpUrlSchema = canonicalString.pipe(z.url()).refine((value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, "Use an HTTP or HTTPS URL");

const experiencePeriodSchema = z
  .object({
    start: monthSchema,
    end: monthSchema.nullable(),
  })
  .strict()
  .superRefine((period, context) => {
    if (period.end !== null && period.end < period.start) {
      context.addIssue({
        code: "custom",
        message: "End date cannot be before start date",
        path: ["end"],
      });
    }
  });

const projectImageSchema = z
  .object({
    src: rootRelativePathSchema,
    alt: nonEmptyString.max(220),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

const responsiveSourceSchema = z
  .object({
    src: rootRelativePathSchema,
    width: z.number().int().positive(),
  })
  .strict();

const responsiveSourcesSchema = z
  .array(responsiveSourceSchema)
  .min(1)
  .max(8)
  .superRefine((sources, context) => {
    const seenPaths = new Set<string>();
    const seenWidths = new Set<number>();
    sources.forEach((source, index) => {
      if (seenPaths.has(source.src) || seenWidths.has(source.width)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate responsive source path or width.",
          path: [index],
        });
      }
      seenPaths.add(source.src);
      seenWidths.add(source.width);
    });
  });

const projectGallerySchema = z
  .array(projectImageSchema)
  .min(1)
  .max(8)
  .superRefine((images, context) => {
    const seenPaths = new Set<string>();
    images.forEach((image, index) => {
      if (seenPaths.has(image.src)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate gallery image source "${image.src}".`,
          path: [index, "src"],
        });
      }
      seenPaths.add(image.src);
    });
  });

export const projectSchema = z
  .object({
    id: safeIdentifierSchema,
    slug: projectSlugSchema,
    selected: z.boolean(),
    order: z.number().int().positive().max(10_000),
    title: nonEmptyString,
    category: nonEmptyString,
    summary: nonEmptyString,
    stack: uniqueNonEmptyStrings("stack", 1, 24),
    cover: projectImageSchema
      .extend({
        objectPosition: z
          .enum([
            "center",
            "top",
            "top right",
            "right",
            "bottom right",
            "bottom",
            "bottom left",
            "left",
            "top left",
          ])
          .optional(),
        sources: responsiveSourcesSchema.optional(),
      })
      .strict(),
    gallery: projectGallerySchema.optional(),
    repositoryUrl: httpUrlSchema.nullable(),
    liveUrl: httpUrlSchema.nullable(),
  })
  .strict();

export const projectsSchema = z
  .array(projectSchema)
  .superRefine((projects, context) => {
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    const seenOrders = new Set<number>();

    projects.forEach((project, index) => {
      for (const [field, value, seen] of [
        ["id", project.id, seenIds],
        ["slug", project.slug, seenSlugs],
        ["order", project.order, seenOrders],
      ] as const) {
        if (seen.has(value as never)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate project ${field} "${value}".`,
            path: [index, field],
          });
        }
        (seen as Set<string | number>).add(value);
      }
    });
  });

export const siteSchema = z.object({
  name: z.string(),
  professionalTitle: z.string(),
  location: z.string(),
  email: z.email(),
  meta: z.object({
    title: z.string(),
    description: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    lead: z.string(),
    accent: z.string(),
    summary: z.string(),
  }),
  practiceAreas: z.array(z.string()),
  github: z.object({
    username: z.string(),
    profileUrl: httpUrlSchema,
    avatarFallback: rootRelativePathSchema,
    avatarAlt: nonEmptyString,
  }),
  linkedinUrl: httpUrlSchema.nullable(),
  resumeUrl: pdfPathSchema.nullable(),
  contact: z.object({
    heading: z.string(),
    label: z.string(),
    emailCta: z.string(),
  }),
});

export const experienceSchema = z
  .object({
    id: safeIdentifierSchema,
    order: z.number().int().positive().max(10_000),
    company: nonEmptyString,
    role: nonEmptyString,
    location: nonEmptyString,
    periods: z.array(experiencePeriodSchema).min(1),
    publicSummary: nonEmptyString,
    skills: uniqueNonEmptyStrings("skills", 1, 24),
    highlights: uniqueNonEmptyStrings("highlights", 1, 24),
  })
  .strict();

export const experienceListSchema = z
  .array(experienceSchema)
  .superRefine((experiences, context) => {
    const seenIds = new Set<string>();
    const seenOrders = new Set<number>();
    experiences.forEach((experience, index) => {
      if (seenIds.has(experience.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate experience id "${experience.id}".`,
          path: [index, "id"],
        });
      }
      seenIds.add(experience.id);
      if (seenOrders.has(experience.order)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate experience order "${experience.order}".`,
          path: [index, "order"],
        });
      }
      seenOrders.add(experience.order);
    });
  });

export type Project = z.infer<typeof projectSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Site = z.infer<typeof siteSchema>;
