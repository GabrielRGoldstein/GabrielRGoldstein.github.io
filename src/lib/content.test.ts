import { describe, expect, it } from "vitest";

import {
  experienceListSchema,
  projectsSchema,
} from "../schemas/content";
import {
  portfolioContent,
  validateExperience,
  validatePortfolioContent,
  validateProjects,
  validateSite,
} from "./content";

const project = (overrides: Record<string, unknown> = {}) => ({
  id: "discord-clone",
  slug: "discord-clone",
  selected: true,
  order: 1,
  title: "Discord Clone",
  category: "fullstack",
  summary: "A complete project summary.",
  stack: ["TypeScript"],
  cover: {
    src: "/images/projects/discord-clone.webp",
    alt: "Discord-style application interface",
    width: 1600,
    height: 1000,
  },
  repositoryUrl: null,
  liveUrl: null,
  ...overrides,
});

const experience = (overrides: Record<string, unknown> = {}) => ({
  id: "l3harris",
  order: 1,
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
    summary:
      "Software engineer turning complicated workflows into dependable tools.",
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

  it("rejects project strings that would require trimming", () => {
    for (const overrides of [
      { title: " Discord Clone" },
      { summary: "A complete project summary. " },
      { stack: ["TypeScript "] },
    ]) {
      expect(() => projectsSchema.parse([project(overrides)])).toThrow(
        /whitespace|title|summary|stack/i,
      );
    }
  });

  it("rejects project paths and URLs that would require trimming", () => {
    const baseCover = project().cover;
    for (const overrides of [
      { cover: { ...baseCover, src: " /images/projects/discord-clone.webp" } },
      {
        cover: {
          ...baseCover,
          sources: [
            { src: "/images/projects/discord-clone-640.webp ", width: 640 },
          ],
        },
      },
      {
        gallery: [
          {
            src: " /images/projects/discord-clone-detail.webp",
            alt: "Project detail",
            width: 1200,
            height: 800,
          },
        ],
      },
      { repositoryUrl: " https://github.com/example/project" },
      { liveUrl: "https://example.com/demo " },
    ]) {
      expect(() => projectsSchema.parse([project(overrides)])).toThrow(
        /whitespace|src|repositoryUrl|liveUrl/i,
      );
    }
  });

  it("rejects unknown fields at every nested project object boundary", () => {
    const baseCover = project().cover;
    for (const overrides of [
      { cover: { ...baseCover, unknownCoverField: true } },
      {
        cover: {
          ...baseCover,
          sources: [
            {
              src: "/images/projects/discord-clone-640.webp",
              width: 640,
              unknownResponsiveField: true,
            },
          ],
        },
      },
      {
        gallery: [
          {
            src: "/images/projects/discord-clone-detail.webp",
            alt: "Project detail",
            width: 1200,
            height: 800,
            unknownGalleryField: true,
          },
        ],
      },
    ]) {
      expect(() => projectsSchema.parse([project(overrides)])).toThrow(/unrecognized|unknown/i);
    }
  });

  it("rejects project slugs that cannot form safe DOM and analytics identifiers", () => {
    for (const slug of [
      "Discord Clone",
      "discord clone",
      "discord_clone",
      "-discord-clone",
      "discord-clone-",
      "discord--clone",
      "a".repeat(65),
    ]) {
      expect(() => validateProjects([project({ slug })])).toThrow(/slug/i);
    }
  });

  it("rejects project IDs that cannot form bounded safe identifiers", () => {
    for (const id of ["Unsafe Project ID", "project_id", "a".repeat(65)]) {
      expect(() => projectsSchema.parse([project({ id })])).toThrow(/id/i);
    }
  });

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

  it.each([0, 1.5, 10_001])("rejects invalid project order value %s", (order) => {
    expect(() => validateProjects([project({ order })])).toThrow(/order/i);
  });

  it("rejects projects with a blank summary", () => {
    expect(() => validateProjects([project({ summary: "   " })])).toThrow(
      /summary/i,
    );
  });

  it("rejects projects with blank image alt text", () => {
    expect(() =>
      validateProjects([
        project({
          cover: {
            src: "/images/projects/discord-clone.webp",
            alt: "   ",
            width: 1600,
            height: 1000,
          },
        }),
      ]),
    ).toThrow(/alt/i);
  });

  it("preserves explicit cover dimensions and optional responsive sources", () => {
    const [validated] = validateProjects([
      project({
        cover: {
          src: "/images/projects/discord-clone.webp",
          alt: "Discord-style application interface",
          width: 1600,
          height: 1000,
          sources: [
            { src: "/images/projects/discord-clone-640.webp", width: 640 },
            { src: "/images/projects/discord-clone-800.webp", width: 800 },
          ],
        },
      }),
    ]);

    expect(validated.cover).toEqual({
      src: "/images/projects/discord-clone.webp",
      alt: "Discord-style application interface",
      width: 1600,
      height: 1000,
      sources: [
        { src: "/images/projects/discord-clone-640.webp", width: 640 },
        { src: "/images/projects/discord-clone-800.webp", width: 800 },
      ],
    });
  });

  it.each([
    [
      [
        { src: "/images/projects/discord-clone-640.webp", width: 640 },
        { src: "/images/projects/discord-clone-640.webp", width: 800 },
      ],
    ],
    [
      [
        { src: "/images/projects/discord-clone-640.webp", width: 640 },
        { src: "/images/projects/discord-clone-800.webp", width: 640 },
      ],
    ],
  ])("rejects duplicate responsive source paths or widths", (sources) => {
    expect(() =>
      validateProjects([
        project({
          cover: {
            src: "/images/projects/discord-clone.webp",
            alt: "Discord-style application interface",
            width: 1600,
            height: 1000,
            sources,
          },
        }),
      ]),
    ).toThrow(/duplicate.*source|source.*duplicate/i);
  });

  it.each([["TypeScript", "TypeScript"], ["TypeScript", "   "]])(
    "rejects duplicate or blank project technologies",
    (stack) => {
      expect(() => validateProjects([project({ stack })])).toThrow(/stack/i);
    },
  );

  it("rejects unknown project fields instead of silently stripping them", () => {
    expect(() =>
      validateProjects([project({ reviewNote: "must not disappear" })]),
    ).toThrow(/unrecognized|reviewNote/i);
  });

  it("preserves a validated project-cover focal position", () => {
    const [validated] = validateProjects([
      project({
        cover: {
          src: "/images/projects/discord-clone.webp",
          alt: "Discord-style application interface",
          width: 1600,
          height: 1000,
          objectPosition: "top",
        },
      }),
    ]);

    expect(validated.cover.objectPosition).toBe("top");
  });

  it("rejects an unsafe project-cover focal position", () => {
    expect(() =>
      validateProjects([
        project({
          cover: {
            src: "/images/projects/discord-clone.webp",
            alt: "Discord-style application interface",
            width: 1600,
            height: 1000,
            objectPosition: "10%; background: red",
          },
        }),
      ]),
    ).toThrow(/objectPosition/i);
  });

  it("preserves validated full-aspect project gallery images", () => {
    const gallery = [
      {
        src: "/images/projects/discord-clone-detail.webp",
        alt: "Discord-style application interface with channels and messages",
        width: 1600,
        height: 1067,
      },
    ];
    const [validated] = validateProjects([project({ gallery })]);

    expect(validated.gallery).toEqual(gallery);
  });

  it("rejects duplicate project gallery sources", () => {
    const image = {
      src: "/images/projects/discord-clone-detail.webp",
      alt: "Discord-style application interface",
      width: 1600,
      height: 1067,
    };
    expect(() => validateProjects([project({ gallery: [image, image] })])).toThrow(
      /duplicate gallery image source/i,
    );
  });

  it("rejects a non-root-relative project gallery path", () => {
    expect(() =>
      validateProjects([
        project({
          gallery: [
            {
              src: "discord-clone-detail.webp",
              alt: "Discord-style application interface with channels and messages",
              width: 1600,
              height: 1067,
            },
          ],
        }),
      ]),
    ).toThrow(/gallery|src/i);
  });

  it("rejects a non-root-relative project cover path", () => {
    expect(() =>
      validateProjects([
        project({
          cover: {
            src: "discord-clone.webp",
            alt: "Discord-style application interface",
            width: 1600,
            height: 1000,
          },
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
            cover: {
              src,
              alt: "Discord-style application interface",
              width: 1600,
              height: 1000,
            },
          }),
        ]),
      ).toThrow(/src/i);
    },
  );

  it.each([
    "/\t/evil.example/image.webp",
    "/\n/evil.example/image.webp",
    "/\r/evil.example/image.webp",
  ])("rejects a control-character-obfuscated project cover: %s", (src) => {
    expect(() =>
      validateProjects([
        project({
          cover: {
            src,
            alt: "Discord-style application interface",
            width: 1600,
            height: 1000,
          },
        }),
      ]),
    ).toThrow(/src/i);
  });

  it.each(["repositoryUrl", "liveUrl"] as const)(
    "rejects an invalid %s",
    (field) => {
      expect(() =>
        validateProjects([project({ [field]: "not-a-url" })]),
      ).toThrow(new RegExp(field, "i"));
    },
  );

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

  it("preserves whether each authored project is selected for the homepage", () => {
    const [validated] = validateProjects([project({ selected: false })]);

    expect(validated.selected).toBe(false);
  });
});

describe("validatePortfolioContent", () => {
  it("exposes only selected projects to the homepage after validating the full collection", () => {
    const content = validatePortfolioContent({
      site: site(),
      projects: [
        project({ selected: false }),
        project({ id: "selected", slug: "selected", selected: true, order: 2 }),
      ],
      experience: [experience()],
    });

    expect(content.projects.map(({ id }) => id)).toEqual(["selected"]);
  });
});

describe("validateExperience", () => {
  it.each(["id", "company", "role", "location", "publicSummary"] as const)(
    "rejects a blank required experience %s",
    (field) => {
      expect(() =>
        validateExperience([experience({ [field]: "   " })]),
      ).toThrow(new RegExp(field, "i"));
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
    expect(() => validateExperience([experience({ periods: [] })])).toThrow(
      /periods/i,
    );
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

  it("rejects duplicate experience IDs at the exported schema boundary", () => {
    expect(() => experienceListSchema.parse([experience(), experience()])).toThrow(
      /duplicate experience id/i,
    );
  });

  it("rejects duplicate or invalid Experience order values at the exported boundary", () => {
    expect(() =>
      experienceListSchema.parse([
        experience(),
        experience({ id: "second-role", order: 1 }),
      ]),
    ).toThrow(/duplicate experience order/i);
    for (const order of [0, 1.5, 10_001]) {
      expect(() => experienceListSchema.parse([experience({ order })])).toThrow(/order/i);
    }
  });

  it("sorts Experience by its unique authored order", () => {
    expect(
      validateExperience([
        experience({ id: "second-role", order: 2 }),
        experience({ id: "first-role", order: 1 }),
      ]).map(({ id }) => id),
    ).toEqual(["first-role", "second-role"]);
  });

  it("rejects Experience strings that would require trimming", () => {
    for (const overrides of [
      { company: " L3Harris" },
      { publicSummary: "Public-safe role summary. " },
      { skills: ["Systems Integration "] },
    ]) {
      expect(() => experienceListSchema.parse([experience(overrides)])).toThrow(
        /whitespace|company|publicSummary|skills/i,
      );
    }
  });

  it("rejects unknown fields at Experience record and period boundaries", () => {
    expect(() =>
      experienceListSchema.parse([experience({ unknownExperienceField: true })]),
    ).toThrow(/unrecognized|unknown/i);
    expect(() =>
      experienceListSchema.parse([
        experience({
          periods: [{ start: "2026-06", end: null, unknownPeriodField: true }],
        }),
      ]),
    ).toThrow(/unrecognized|unknown/i);
  });

  it("rejects experience IDs that cannot form safe DOM and ARIA identifiers", () => {
    for (const id of [
      "role one",
      "role_one",
      "-role",
      "role-",
      "a".repeat(65),
    ]) {
      expect(() => validateExperience([experience({ id })])).toThrow(/id/i);
    }
  });

  it.each([
    { skills: ["Testing", "Testing"] },
    { skills: ["Testing", "   "] },
    { highlights: ["Impact", "Impact"] },
    { highlights: ["Impact", "   "] },
  ])("rejects duplicate or blank experience lists", (overrides) => {
    expect(() => validateExperience([experience(overrides)])).toThrow(
      /skills|highlights/i,
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
    expect(() => validateSite(site({ email: "not-an-email" }))).toThrow(
      /email/i,
    );
  });

  it("rejects an invalid non-null LinkedIn URL", () => {
    expect(() => validateSite(site({ linkedinUrl: "not-a-url" }))).toThrow(
      /linkedinUrl/i,
    );
  });

  it("rejects an unsafe LinkedIn URL protocol", () => {
    expect(() =>
      validateSite(site({ linkedinUrl: "javascript:alert(1)" })),
    ).toThrow(/linkedinUrl/i);
  });

  it("rejects a non-root-relative résumé path", () => {
    expect(() => validateSite(site({ resumeUrl: "resume.pdf" }))).toThrow(
      /resumeUrl/i,
    );
  });

  it("rejects a non-PDF résumé asset", () => {
    expect(() => validateSite(site({ resumeUrl: "/resume.docx" }))).toThrow(
      /resumeUrl/i,
    );
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

  it.each([
    "/\t/evil.example/resume.pdf",
    "/\n/evil.example/resume.pdf",
    "/\r/evil.example/resume.pdf",
  ])("rejects a control-character-obfuscated résumé asset: %s", (resumeUrl) => {
    expect(() => validateSite(site({ resumeUrl }))).toThrow(/resumeUrl/i);
  });

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

  it.each([
    "/\t/evil.example/avatar.jpg",
    "/\n/evil.example/avatar.jpg",
    "/\r/evil.example/avatar.jpg",
  ])(
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
    expect(portfolioContent.projects.length).toBeGreaterThan(0);
    expect(portfolioContent.projects.every(({ selected }) => selected)).toBe(
      true,
    );
    const orders = portfolioContent.projects.map(({ order }) => order);
    expect(orders).toEqual([...orders].sort((left, right) => left - right));
    expect(portfolioContent.experience).toHaveLength(4);
  });
});
