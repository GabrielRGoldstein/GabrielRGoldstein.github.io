export const ANALYTICS_EVENTS = [
  "project_open",
  "project_repository_click",
  "project_demo_click",
  "resume_download",
  "github_profile_click",
  "linkedin_click",
  "email_click",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsProperties = Readonly<Record<string, string>>;

const ANALYTICS_EVENT_SET = new Set<string>(ANALYTICS_EVENTS);

export function isAnalyticsEvent(value: string | undefined): value is AnalyticsEvent {
  return value !== undefined && ANALYTICS_EVENT_SET.has(value);
}

export interface AnalyticsProvider {
  dispatch(event: AnalyticsEvent, properties?: AnalyticsProperties): void;
}

const PROJECT_EVENTS = new Set<AnalyticsEvent>([
  "project_open",
  "project_repository_click",
  "project_demo_click",
]);
const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function hasAllowedProperties(
  event: AnalyticsEvent,
  properties: AnalyticsProperties | undefined,
): boolean {
  if (!PROJECT_EVENTS.has(event)) return properties === undefined;
  if (!properties) return false;

  const prototype = Object.getPrototypeOf(properties);
  if (prototype !== Object.prototype && prototype !== null) return false;

  const keys = Reflect.ownKeys(properties);
  if (keys.length !== 1 || keys[0] !== "project_id") return false;
  const descriptor = Object.getOwnPropertyDescriptor(properties, "project_id");
  if (!descriptor?.enumerable || !("value" in descriptor)) return false;

  const projectId = descriptor.value;
  return (
    typeof projectId === "string" &&
    projectId.length <= 64 &&
    PROJECT_ID_PATTERN.test(projectId)
  );
}

export function track(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
  provider?: AnalyticsProvider,
): boolean {
  try {
    if (
      !isAnalyticsEvent(event) ||
      !provider ||
      !hasAllowedProperties(event, properties)
    ) {
      return false;
    }

    provider.dispatch(event, properties);
    return true;
  } catch {
    return false;
  }
}
