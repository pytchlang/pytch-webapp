import {
  ActivityBarTabKey,
} from "../../../src/model/junior/edit-state";

export type KeyOrShortcut = Parameters<typeof cy.realPress>[0];

export const kShiftTab: KeyOrShortcut = ["Shift", "Tab"];
export const kShiftF10: KeyOrShortcut = ["Shift", "F10"];

export function realPress(keyOrShortcut: KeyOrShortcut, nTimes?: number) {
  nTimes ??= 1;
  for (let _i = 0; _i !== nTimes; ++_i) {
    cy.realPress(keyOrShortcut);
  }
}

////////////////////////////////////////////////////////////////////////

export function activateFlatAsset(assetIdx: number): void {
  const childIdx1b = assetIdx + 1;
  cy.get(`.AssetCardList *:nth-child(${childIdx1b}) .AssetCard`).click();
}

////////////////////////////////////////////////////////////////////////

export function activateActivityViaTab(tab: ActivityBarTabKey) {
  cy.get(`button[data-activity-bar-tab="${tab}"]`).click();
}

////////////////////////////////////////////////////////////////////////

function helpEntrySelector(sectionIdx: number, entryIdx: number) {
  const sectionIdx1b = sectionIdx + 1;
  const entryIdx1b = entryIdx + 2; // Skip first child (<summary> elt)
  return (
    `.HelpSidebar details:nth-child(${sectionIdx1b})` +
    ` > details:nth-child(${entryIdx1b}) > summary`
  );
}

export function assertHelpEntryVisibility(
  entryPath: Array<number>,
  visibilityPredicate: "visible" | "hidden"
): void {
  // Can't just use should("be.visible") and should("not.be.visible").
  // https://github.com/cypress-io/cypress/issues/30555

  const summarySelector = helpEntrySelector(entryPath[0], entryPath[1]);
  cy.get(`${summarySelector} + div`)
    .parent()
    .as("helpEntry")
    .should("have.class", "pytch-method");

  switch (visibilityPredicate) {
    case "visible":
      cy.get("@helpEntry").should("have.attr", "open");
      break;
    case "hidden":
      cy.get("@helpEntry").should("not.have.attr", "open");
      break;
  }
}

////////////////////////////////////////////////////////////////////////

export function assertNoDropdownMenu() {
  cy.get('div[role="menu"].show.dropdown').should("not.exist");
}

export function summonCcMenuByKbd() {
  assertNoDropdownMenu();
  realPress(kShiftF10);
  cy.get('div[role="menu"].show.dropdown').should("have.length", 1);
}

export function chooseCcMenuItem(itemIndex: number | "Home" | "End") {
  summonCcMenuByKbd();
  if (itemIndex === "Home" || itemIndex === "End") {
    realPress(itemIndex);
  } else {
    realPress("ArrowDown", itemIndex);
  }
  realPress("Enter");
}
