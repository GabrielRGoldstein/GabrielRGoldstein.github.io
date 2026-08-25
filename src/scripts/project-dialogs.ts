import {
  createUmamiProvider,
  trackElement,
  type UmamiHost,
} from "../lib/analytics-browser";

interface ProjectDialogRelationship {
  trigger: HTMLButtonElement;
  dialog: HTMLDialogElement;
  closeButton: HTMLButtonElement;
  card: HTMLElement;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
const INTERACTIVE_CARD_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
].join(",");
const relationships: ProjectDialogRelationship[] = [];
const DialogConstructor =
  typeof globalThis.HTMLDialogElement === "function"
    ? globalThis.HTMLDialogElement
    : null;
const supportsNativeDialog =
  DialogConstructor !== null &&
  typeof DialogConstructor.prototype.showModal === "function" &&
  typeof DialogConstructor.prototype.close === "function";

function hasContainedIdReferences(
  dialog: HTMLDialogElement,
  attribute: "aria-labelledby" | "aria-describedby",
): boolean {
  const value = dialog.getAttribute(attribute)?.trim();
  if (!value) return false;

  return value.split(/\s+/).every((id) => {
    const referenced = document.getElementById(id);
    return referenced !== null && dialog.contains(referenced);
  });
}

function focusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.getClientRects().length > 0,
  );
}

function focusFirst(dialog: HTMLDialogElement): void {
  const [first] = focusableElements(dialog);
  first?.focus();
}

function readEventTarget(event: Event): EventTarget | null {
  try {
    return event.target;
  } catch {
    return null;
  }
}

function eventTargetElement(event: Event): Element | null {
  const target = readEventTarget(event);
  if (target instanceof Element) return target;
  return target instanceof Node ? target.parentElement : null;
}

function containTabFocus(
  dialog: HTMLDialogElement,
  event: KeyboardEvent,
): void {
  if (event.key !== "Tab") return;
  const focusable = focusableElements(dialog);
  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (focusable.length === 1) {
    event.preventDefault();
    first.focus();
    return;
  }

  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

function setPageDialogState(): void {
  document.documentElement.classList.toggle(
    "project-dialog-open",
    relationships.some(({ dialog }) => dialog.open),
  );
}

function recordProjectOpen(trigger: HTMLButtonElement): void {
  try {
    trackElement(
      {
        analyticsEvent: "project_open",
        analyticsProjectId: trigger.dataset.analyticsProjectId,
      },
      createUmamiProvider(window as unknown as UmamiHost),
    );
  } catch {
    // Analytics is never allowed to break the dialog interaction.
  }
}

if (supportsNativeDialog && DialogConstructor) {
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      "[data-project-dialog-trigger]",
    ),
  );

  for (const trigger of triggers) {
    const dialogId = trigger.getAttribute("aria-controls");
    const dialog = dialogId ? document.getElementById(dialogId) : null;
    if (!(dialog instanceof DialogConstructor)) continue;

    const closeButton = dialog.querySelector<HTMLButtonElement>(
      "[data-project-dialog-close]",
    );
    const card = trigger.closest<HTMLElement>(".project-card");
    if (!closeButton) continue;
    if (!card?.querySelector("[data-project-dialog-fallback]")) continue;
    if (!hasContainedIdReferences(dialog, "aria-labelledby")) continue;
    if (!hasContainedIdReferences(dialog, "aria-describedby")) continue;

    relationships.push({ trigger, dialog, closeButton, card });
  }
}

for (const { trigger, dialog, closeButton, card } of relationships) {
  card.classList.add("project-card--dialog-enhanced");
  trigger.hidden = false;

  trigger.addEventListener("click", () => {
    if (dialog.open) return;

    let opened = false;
    try {
      dialog.showModal();
      if (!dialog.open) throw new Error("Dialog did not enter modal state");
      setPageDialogState();
      closeButton.focus();
      opened = true;
    } catch {
      trigger.hidden = true;
      card.classList.remove("project-card--dialog-enhanced");
      setPageDialogState();
    }
    if (opened) recordProjectOpen(trigger);
  });

  card.addEventListener("click", (event) => {
    const target = eventTargetElement(event);
    if (!target || target.closest(INTERACTIVE_CARD_SELECTOR)) return;
    trigger.click();
  });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", (event) => {
    try {
      if (readEventTarget(event) === dialog) dialog.close();
    } catch {
      // Hostile event access or a throwing close must not escape the listener.
    }
  });

  dialog.addEventListener("keydown", (event) => {
    containTabFocus(dialog, event);
  });

  dialog.addEventListener("close", () => {
    setPageDialogState();
    if (trigger.isConnected) trigger.focus();
  });
}

document.addEventListener("focusin", (event) => {
  try {
    const activeRelationship = relationships.find(({ dialog }) => dialog.open);
    if (!activeRelationship) return;
    const target = readEventTarget(event);
    if (!(target instanceof Node) || !activeRelationship.dialog.contains(target)) {
      focusFirst(activeRelationship.dialog);
    }
  } catch {
    // Focus containment is best-effort when browser event objects are hostile.
  }
});
