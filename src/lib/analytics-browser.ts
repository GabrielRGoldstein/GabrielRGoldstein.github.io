import {
  isAnalyticsEvent,
  track,
  type AnalyticsEvent,
  type AnalyticsProperties,
  type AnalyticsProvider,
} from "./analytics";

export interface AnalyticsDataset {
  readonly analyticsEvent?: string;
  readonly analyticsProjectId?: string;
  readonly [key: string]: string | undefined;
}

interface UmamiTracker {
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): unknown;
}

export interface UmamiHost {
  readonly umami?: UmamiTracker;
}

export function createUmamiProvider(
  host: UmamiHost,
): AnalyticsProvider | undefined {
  const tracker = host.umami;
  if (!tracker || typeof tracker.track !== "function") return undefined;

  return {
    dispatch(event, properties) {
      tracker.track(event, properties);
    },
  };
}

export function trackElement(
  dataset: AnalyticsDataset,
  provider?: AnalyticsProvider,
): boolean {
  const event = dataset.analyticsEvent;
  if (!isAnalyticsEvent(event)) return false;

  const properties = dataset.analyticsProjectId
    ? { project_id: dataset.analyticsProjectId }
    : undefined;
  return track(event, properties, provider);
}

interface AnalyticsTarget {
  closest(selector: string): { readonly dataset: AnalyticsDataset } | null;
}

function hasClosestTarget(value: unknown): value is AnalyticsTarget {
  return (
    typeof value === "object" &&
    value !== null &&
    "closest" in value &&
    typeof value.closest === "function"
  );
}

export function initializeAnalytics(
  root: Document = document,
  host: UmamiHost = window as unknown as UmamiHost,
): () => void {
  const listener: EventListener = (event) => {
    if (!hasClosestTarget(event.target)) return;

    const element = event.target.closest("[data-analytics-event]");
    if (!element) return;

    trackElement(element.dataset, createUmamiProvider(host));
  };

  root.addEventListener("click", listener, true);
  return () => root.removeEventListener("click", listener, true);
}
