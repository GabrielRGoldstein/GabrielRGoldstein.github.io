import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM format");
const localPathBase = new URL("https://portfolio.invalid");
const rootRelativePathSchema = z.string().refine((value) => {
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
const httpUrlSchema = z.url().refine((value) => {
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
  .superRefine((period, context) => {
    if (period.end !== null && period.end < period.start) {
      context.addIssue({
        code: "custom",
        message: "End date cannot be before start date",
        path: ["end"],
      });
    }
  });

export const projectSchema = z.object({
  id: nonEmptyString,
  slug: nonEmptyString,
  featured: z.boolean(),
  order: z.number().int().positive(),
  title: nonEmptyString,
  category: nonEmptyString,
  summary: nonEmptyString,
  stack: z.array(z.string()),
  cover: z.object({
    src: rootRelativePathSchema,
    alt: nonEmptyString,
  }),
  repositoryUrl: httpUrlSchema.nullable(),
  liveUrl: httpUrlSchema.nullable(),
});

export const projectsSchema = z.array(projectSchema);

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

export const experienceSchema = z.object({
  id: nonEmptyString,
  company: nonEmptyString,
  role: nonEmptyString,
  location: nonEmptyString,
  periods: z.array(experiencePeriodSchema).min(1),
  publicSummary: nonEmptyString,
  skills: z.array(z.string()),
  highlights: z.array(z.string()),
});

export const experienceListSchema = z.array(experienceSchema);

export type Project = z.infer<typeof projectSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Site = z.infer<typeof siteSchema>;
