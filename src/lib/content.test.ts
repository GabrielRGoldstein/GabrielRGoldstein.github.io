import { describe, expect, it } from "vitest";

import {
  portfolioContent,
  validateExperience,
  validateProjects,
  validateSite,
} from "./content";

const project = (overrides: Record<string, unknown> = {}) => ({
  id: "discord-clone",
  slug: "discord-clone",
  featured: true,
  order: 1,
  title: "Discord Clone",
  category: "fullstack",
  summary: "A complete project summary.",
  stack: ["TypeScript"],
  cover: {
    src: "/images/projects/discord-clone.webp",
    alt: "Discord-style application interface",
  },
  repositoryUrl: null,
  liveUrl: null,
  ...overrides,
});

const experience = (overrides: Record<string, unknown> = {}) => ({
  id: "l3harris",
  company: "L3Harris",
  role: "Test and Integration Specialist",
  location: "Colorado Springs, CO",
  periods: [{ start: "2026-06", end: null }],
  publicSummary: "Public-safe role summary.",
  skills: ["Systems Integration"],
  highlights: ["Public-safe impact statement."],
  ...overrides,
});

const site = (overrides: Record<string, unknown> = {}) => ({
  name: "Gabriel Goldstein",
  professionalTitle: "Software Engineer",
  location: "Colorado Springs, Colorado",
  email: "gabriel@example.com",
  meta: {
    title: "Gabriel Goldstein — Software Engineer",
    description: "Software engineer building dependable tools.",
  },
  hero: {
    eyebrow: "Software engineer · Colorado Springs",
    lead: "Complicated systems.",
    accent: "Dependable tools.",
    summary: "Software engineer turning complicated workflows into dependable tools.",
  },
  practiceAreas: ["Systems", "Security", "Data", "Product"],
  github: {
    username: "GabrielRGoldstein",
    profileUrl: "https://github.com/GabrielRGoldstein",
    avatarFallback: "/images/github-avatar.jpg",
    avatarAlt: "Illustrated wolf GitHub avatar for GabrielRGoldstein",
  },
  linkedinUrl: null,
  resumeUrl: null,
  contact: {
    heading: "Have a role or project in mind?",
    label: "Choose a next step",
    emailCta: "Email me",
  },
  ...overrides,
});

describe("validateProjects", () => {
  it.each(["id", "slug", "title", "category"] as const)(
    "rejects a blank required project %s",
    (field) => {
      expect(() => validateProjects([project({ [field]: "   " })])).toThrow(
        new RegExp(field, "i"),
      );
    },
  );

  it("rejects duplicate project IDs", () => {
    expect(() =>
      validateProjects([
        project(),
        project({ id: "discord-clone", slug: "another-project", order: 2 }),
      ]),
    ).toThrow(/duplicate project id.*discord-clone/i);
  });

  it("rejects duplicate project slugs", () => {
    expect(() =>
      validateProjects([
        project(),
        project({ id: "another-project", slug: "discord-clone", order: 2 }),
      ]),
    ).toThrow(/duplicate project slug.*discord-clone/i);
  });

  it("rejects conflicting project order values", () => {
    expect(() =>
      validateProjects([
        project(),
        project({ id: "another-project", slug: "another-project", order: 1 }),
      ]),
    ).toThrow(/duplicate project order.*1/i);
  });

  it.each([0, 1.5])("rejects invalid project order value %s", (order) => {
    expect(() => validateProjects([project({ order })])).toThrow(/order/i);
  });

  it("rejects projects with a blank summary", () => {
    expect(() => validateProjects([project({ summary: "   " })])).toThrow(/summary/i);
  });

  it("rejects projects with blank image alt text", () => {
    expect(() =>
      validateProjects([
        project({
          cover: { src: "/images/projects/discord-clone.webp", alt: "   " },
        }),
      ]),
    ).toThrow(/alt/i);
  });

  it("rejects a non-root-relative project cover path", () => {
    expect(() =>
      validateProjects([
        project({
          cover: { src: "discord-clone.webp", alt: "Discord-style application interface" },
        }),
      ]),
    ).toThrow(/src/i);
  });

  it.each(["//evil.example/image.webp", "/\\evil.example/image.webp"])(
    "rejects a network-path project cover: %s",
    (src) => {
      expect(() =>
        validateProjects([
          project({
            cover: { src, alt: "Discord-style application interface" },
          }),
        ]),
      ).toThrow(/src/i);
    },
  );

  it.each(["/\t/evil.example/image.webp", "/\n/evil.example/image.webp", "/\r/evil.example/image.webp"])(
    "rejects a control-character-obfuscated project cover: %s",
    (src) => {
      expect(() =>
        validateProjects([
          project({
            cover: { src, alt: "Discord-style application interface" },
          }),
        ]),
      ).toThrow(/src/i);
    },
  );

  it.each(["repositoryUrl", "liveUrl"] as const)("rejects an invalid %s", (field) => {
    expect(() => validateProjects([project({ [field]: "not-a-url" })])).toThrow(
      new RegExp(field, "i"),
    );
  });

  it.each(["repositoryUrl", "liveUrl"] as const)(
    "rejects an unsafe %s protocol",
    (field) => {
      expect(() =>
        validateProjects([project({ [field]: "javascript:alert(1)" })]),
      ).toThrow(new RegExp(field, "i"));
    },
  );

  it("sorts projects by authored order", () => {
    const projects = validateProjects([
      project({ id: "second", slug: "second", order: 2 }),
      project(),
    ]);

    expect(projects.map(({ id }) => id)).toEqual(["discord-clone", "second"]);
  });
});

describe("validateExperience", () => {
  it.each(["id", "company", "role", "location", "publicSummary"] as const)(
    "rejects a blank required experience %s",
    (field) => {
      expect(() => validateExperience([experience({ [field]: "   " })])).toThrow(
        new RegExp(field, "i"),
      );
    },
  );

  it("rejects malformed experience dates", () => {
    expect(() =>
      validateExperience([
        experience({ periods: [{ start: "June 2026", end: null }] }),
      ]),
    ).toThrow(/start/i);
  });

  it("rejects an experience entry with no date periods", () => {
    expect(() => validateExperience([experience({ periods: [] })])).toThrow(/periods/i);
  });

  it("rejects an experience range ending before it starts", () => {
    expect(() =>
      validateExperience([
        experience({ periods: [{ start: "2026-06", end: "2026-05" }] }),
      ]),
    ).toThrow(/end.*before.*start/i);
  });

  it("rejects duplicate experience IDs", () => {
    expect(() => validateExperience([experience(), experience()])).toThrow(
      /duplicate experience id.*l3harris/i,
    );
  });
});

describe("validateSite", () => {
  it("rejects an invalid GitHub profile URL", () => {
    const validSite = site();

    expect(() =>
      validateSite({
        ...validSite,
        github: {
          ...validSite.github,
          profileUrl: "not-a-url",
        },
      }),
    ).toThrow(/profileUrl/i);
  });

  it("rejects an unsafe GitHub profile URL protocol", () => {
    const validSite = site();

    expect(() =>
      validateSite({
        ...validSite,
        github: {
          ...validSite.github,
          profileUrl: "javascript:alert(1)",
        },
      }),
    ).toThrow(/profileUrl/i);
  });

  it("rejects an invalid contact email", () => {
    expect(() => validateSite(site({ email: "not-an-email" }))).toThrow(/email/i);
  });

  it("rejects an invalid non-null LinkedIn URL", () => {
    expect(() => validateSite(site({ linkedinUrl: "not-a-url" }))).toThrow(/linkedinUrl/i);
  });

  it("rejects an unsafe LinkedIn URL protocol", () => {
    expect(() => validateSite(site({ linkedinUrl: "javascript:alert(1)" }))).toThrow(
      /linkedinUrl/i,
    );
  });

  it("rejects a non-root-relative résumé path", () => {
    expect(() => validateSite(site({ resumeUrl: "resume.pdf" }))).toThrow(/resumeUrl/i);
  });

  it("rejects a non-PDF résumé asset", () => {
    expect(() => validateSite(site({ resumeUrl: "/resume.docx" }))).toThrow(/resumeUrl/i);
  });

  it.each(["/resume.docx?download=.pdf", "/resume.docx#.pdf"])(
    "rejects a résumé whose query or fragment disguises a non-PDF pathname: %s",
    (resumeUrl) => {
      expect(() => validateSite(site({ resumeUrl }))).toThrow(/resumeUrl/i);
    },
  );

  it.each(["/resume.pdf?download=1", "/resume.PDF#latest"])(
    "accepts a PDF résumé pathname with a query or fragment: %s",
    (resumeUrl) => {
      expect(validateSite(site({ resumeUrl })).resumeUrl).toBe(resumeUrl);
    },
  );

  it.each(["//evil.example/resume.pdf", "/\\evil.example/resume.pdf"])(
    "rejects a network-path résumé asset: %s",
    (resumeUrl) => {
      expect(() => validateSite(site({ resumeUrl }))).toThrow(/resumeUrl/i);
    },
  );

  it.each(["/\t/evil.example/resume.pdf", "/\n/evil.example/resume.pdf", "/\r/evil.example/resume.pdf"])(
    "rejects a control-character-obfuscated résumé asset: %s",
    (resumeUrl) => {
      expect(() => validateSite(site({ resumeUrl }))).toThrow(/resumeUrl/i);
    },
  );

  it("rejects blank GitHub avatar alt text", () => {
    const validSite = site();

    expect(() =>
      validateSite({
        ...validSite,
        github: {
          ...validSite.github,
          avatarAlt: "   ",
        },
      }),
    ).toThrow(/avatarAlt/i);
  });

  it("rejects a non-root-relative GitHub avatar fallback", () => {
    const validSite = site();

    expect(() =>
      validateSite({
        ...validSite,
        github: {
          ...validSite.github,
          avatarFallback: "github-avatar.jpg",
        },
      }),
    ).toThrow(/avatarFallback/i);
  });

  it.each(["//evil.example/avatar.jpg", "/\\evil.example/avatar.jpg"])(
    "rejects a network-path GitHub avatar fallback: %s",
    (avatarFallback) => {
      const validSite = site();

      expect(() =>
        validateSite({
          ...validSite,
          github: {
            ...validSite.github,
            avatarFallback,
          },
        }),
      ).toThrow(/avatarFallback/i);
    },
  );

  it.each(["/\t/evil.example/avatar.jpg", "/\n/evil.example/avatar.jpg", "/\r/evil.example/avatar.jpg"])(
    "rejects a control-character-obfuscated GitHub avatar fallback: %s",
    (avatarFallback) => {
      const validSite = site();

      expect(() =>
        validateSite({
          ...validSite,
          github: {
            ...validSite.github,
            avatarFallback,
          },
        }),
      ).toThrow(/avatarFallback/i);
    },
  );
});

describe("portfolioContent", () => {
  it("loads and validates the authored JSON sources", () => {
    expect(portfolioContent.site.github.username).toBe("GabrielRGoldstein");
    expect(portfolioContent.projects.map(({ order }) => order)).toEqual([1, 2, 3, 4]);
    expect(portfolioContent.experience).toHaveLength(4);
  });
});
