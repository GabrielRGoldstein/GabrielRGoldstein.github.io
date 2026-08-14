import { describe, expect, it, vi } from "vitest";

import {
  createUmamiProvider,
  initializeAnalytics,
  trackElement,
  type AnalyticsDataset,
  type UmamiHost,
} from "./analytics-browser";
import type { AnalyticsProvider } from "./analytics";

describe("browser analytics adapter", () => {
  it("maps an authored element event through the neutral provider", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };

    expect(trackElement({ analyticsEvent: "linkedin_click" }, provider)).toBe(true);
    expect(provider.dispatch).toHaveBeenCalledWith("linkedin_click", undefined);
  });

  it("rejects unknown events and project events without a valid authored project id", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };
    const invalidDatasets: AnalyticsDataset[] = [
      { analyticsEvent: "visitor_email" },
      { analyticsEvent: "project_demo_click" },
      { analyticsEvent: "project_repository_click", analyticsProjectId: "../private" },
    ];

    for (const dataset of invalidDatasets) {
      expect(trackElement(dataset, provider)).toBe(false);
    }
    expect(provider.dispatch).not.toHaveBeenCalled();
  });

  it("passes only project_id for an authored project conversion", () => {
    const provider: AnalyticsProvider = { dispatch: vi.fn() };

    expect(
      trackElement(
        {
          analyticsEvent: "project_repository_click",
          analyticsProjectId: "dependable-tools",
          visitorEmail: "must-not-dispatch@example.com",
        },
        provider,
      ),
    ).toBe(true);
    expect(provider.dispatch).toHaveBeenCalledWith("project_repository_click", {
      project_id: "dependable-tools",
    });
  });

  it("delegates authored click markers and provides cleanup", () => {
    const umamiTrack = vi.fn();
    let clickListener: EventListener | undefined;
    const root = {
      addEventListener: vi.fn((_type: string, listener: EventListener) => {
        clickListener = listener;
      }),
      removeEventListener: vi.fn(),
    } as unknown as Document;
    const target = {
      closest: vi.fn(() => ({
        dataset: { analyticsEvent: "email_click" },
      })),
    };

    const cleanup = initializeAnalytics(root, {
      umami: { track: umamiTrack },
    });
    clickListener?.({ target } as unknown as Event);

    expect(target.closest).toHaveBeenCalledWith("[data-analytics-event]");
    expect(umamiTrack).toHaveBeenCalledOnce();
    expect(umamiTrack).toHaveBeenCalledWith("email_click", undefined);

    cleanup();
    expect(root.removeEventListener).toHaveBeenCalledWith(
      "click",
      clickListener,
      true,
    );
  });

  it("adapts only an available Umami tracker", () => {
    const umamiTrack = vi.fn();
    const host: UmamiHost = { umami: { track: umamiTrack } };
    const provider = createUmamiProvider(host);

    expect(provider).toBeDefined();
    provider?.dispatch("resume_download");
    expect(umamiTrack).toHaveBeenCalledWith("resume_download", undefined);
    expect(createUmamiProvider({})).toBeUndefined();
  });
});
