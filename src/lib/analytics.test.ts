import { describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_EVENTS,
  track,
  type AnalyticsProperties,
  type AnalyticsProvider,
} from "./analytics";

describe("analytics", () => {
  it("exposes the stable allowlisted event dictionary", () => {
    expect(ANALYTICS_EVENTS).toEqual([
      "project_open",
      "project_repository_click",
      "project_demo_click",
      "resume_download",
      "github_profile_click",
      "linkedin_click",
      "email_click",
    ]);
  });

  it("rejects an event outside the runtime allowlist", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };
    const untypedTrack = track as unknown as (
      event: string,
      properties: AnalyticsProperties | undefined,
      provider: AnalyticsProvider,
    ) => boolean;

    expect(untypedTrack("not_allowlisted", undefined, provider)).toBe(false);
    expect(provider.dispatch).not.toHaveBeenCalled();
  });

  it("is a no-op when no analytics provider is available", () => {
    expect(track("email_click", undefined, undefined)).toBe(false);
  });

  it("dispatches an allowlisted event through the injected provider", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };

    expect(track("github_profile_click", undefined, provider)).toBe(true);
    expect(provider.dispatch).toHaveBeenCalledOnce();
    expect(provider.dispatch).toHaveBeenCalledWith("github_profile_click", undefined);
  });

  it("contains provider failures so site behavior remains independent", () => {
    const provider: AnalyticsProvider = {
      dispatch: () => {
        throw new Error("provider unavailable");
      },
    };

    expect(() => track("resume_download", undefined, provider)).not.toThrow();
    expect(track("resume_download", undefined, provider)).toBe(false);
  });

  it("allows only a slug-like project_id on project events", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };

    expect(
      track("project_repository_click", { project_id: "dependable-tools" }, provider),
    ).toBe(true);
    expect(provider.dispatch).toHaveBeenCalledWith("project_repository_click", {
      project_id: "dependable-tools",
    });

    for (const properties of [
      undefined,
      { project_id: "../private" },
      { project_id: "dependable-tools", visitor: "known" },
    ] as Array<AnalyticsProperties | undefined>) {
      expect(track("project_repository_click", properties, provider)).toBe(false);
    }
    expect(provider.dispatch).toHaveBeenCalledOnce();
  });

  it("rejects unexpected properties before provider dispatch", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };

    expect(track("email_click", { email: "visitor@example.com" }, provider)).toBe(false);
    expect(provider.dispatch).not.toHaveBeenCalled();
  });

  it("contains hostile property enumeration and value access", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };
    const throwingKeys = new Proxy(
      { project_id: "dependable-tools" },
      {
        ownKeys() {
          throw new Error("ownKeys failure");
        },
      },
    ) as AnalyticsProperties;
    const throwingValue = {} as AnalyticsProperties;
    Object.defineProperty(throwingValue, "project_id", {
      enumerable: true,
      get() {
        throw new Error("property getter failure");
      },
    });
    const hiddenProperty = { project_id: "dependable-tools" } as AnalyticsProperties;
    Object.defineProperty(hiddenProperty, "visitor", {
      value: "hidden",
      enumerable: false,
    });
    const symbolProperty = {
      project_id: "dependable-tools",
      [Symbol("visitor")]: "hidden",
    } as AnalyticsProperties;
    const inheritedProperty = Object.assign(
      Object.create({ visitor: "hidden" }),
      { project_id: "dependable-tools" },
    ) as AnalyticsProperties;

    for (const properties of [
      throwingKeys,
      throwingValue,
      hiddenProperty,
      symbolProperty,
      inheritedProperty,
    ]) {
      expect(() => track("project_open", properties, provider)).not.toThrow();
      expect(track("project_open", properties, provider)).toBe(false);
    }
    expect(provider.dispatch).not.toHaveBeenCalled();
  });
});
