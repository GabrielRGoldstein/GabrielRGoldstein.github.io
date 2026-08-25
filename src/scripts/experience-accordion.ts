interface Disclosure {
  button: HTMLButtonElement;
  panel: HTMLElement;
  label: HTMLElement;
  indicator: HTMLElement;
}

const disclosures: Disclosure[] = [];
const rows = Array.from(
  document.querySelectorAll<HTMLElement>("[data-experience-id]"),
);

function setExpanded(disclosure: Disclosure, expanded: boolean): void {
  disclosure.button.setAttribute("aria-expanded", String(expanded));
  disclosure.label.textContent = expanded ? "Hide details" : "Show details";
  disclosure.indicator.textContent = expanded ? "−" : "+";
  disclosure.panel.hidden = !expanded;
}

for (const row of rows) {
  const button = row.querySelector<HTMLButtonElement>(
    "[data-experience-toggle]",
  );
  const panel = row.querySelector<HTMLElement>("[data-experience-panel]");
  const label = button?.querySelector<HTMLElement>(
    "[data-experience-toggle-label]",
  );
  const indicator = button?.querySelector<HTMLElement>(
    "[data-experience-indicator]",
  );

  if (
    !button ||
    !panel ||
    !label ||
    !indicator ||
    button.getAttribute("aria-controls") !== panel.id
  ) {
    continue;
  }

  disclosures.push({ button, panel, label, indicator });
}

for (const disclosure of disclosures) {
  disclosure.button.hidden = false;
  setExpanded(disclosure, false);

  disclosure.button.addEventListener("click", () => {
    const willExpand =
      disclosure.button.getAttribute("aria-expanded") !== "true";

    for (const item of disclosures) {
      setExpanded(item, false);
    }

    if (willExpand) {
      setExpanded(disclosure, true);
    }
  });
}
