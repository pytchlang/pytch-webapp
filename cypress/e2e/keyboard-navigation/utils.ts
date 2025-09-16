import {
  ActivityBarTabKey,
  ActorPropertiesTabKey,
} from "../../../src/model/junior/edit-state";
import { keyInLayoutLocator } from "../../../src/model/junior/keyboard-layout";
import { assertNever } from "../../../src/utils";

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

export function activateHatBlockOption(optionIdx: number): void {
  cy.get(".EventKindOption").eq(optionIdx).click();
}

export function activateKeyPressedOption(browserKeyName: string): void {
  const selector = keyPressedOptionSelector(browserKeyName);
  cy.get(selector).click();
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

function getLearnerTaskCheckboxButton(taskIdx: number) {
  return cy
    .get(".Lesson-Chapter .LearnerTask")
    .eq(taskIdx)
    .find("button.TaskCheckboxButton");
}

function getLearnerTaskHelpButton(taskIdx: number) {
  return cy
    .get(".Lesson-Chapter .LearnerTask")
    .eq(taskIdx)
    .find("button.HelpStageButton");
}

export function assertLearnerTaskDoneState(
  learnerTaskIdx: number,
  expState: "click-when-done" | "click-to-rewind"
) {
  const expContents = (() => {
    switch (expState) {
      case "click-when-done":
        return "Click when you’ve done this";
      case "click-to-rewind":
        return "Click to rewind to this task";
      default:
        return assertNever(expState);
    }
  })();

  getLearnerTaskCheckboxButton(learnerTaskIdx).contains(expContents);
}

export function assertLearnerTaskHelpState(
  learnerTaskIdx: number,
  expState: "hint" | "show" | "hide"
) {
  const expContents = (() => {
    switch (expState) {
      case "hint":
        return "Hint";
      case "show":
        return "Show me";
      case "hide":
        return "Hide help";
      default:
        return assertNever(expState);
    }
  })();

  getLearnerTaskHelpButton(learnerTaskIdx).should("have.text", expContents);
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

function keyPressedOptionSelector(keyBrowserName: string): string {
  const keyLocator = keyInLayoutLocator(keyBrowserName);
  const rowChildIdx1b = keyLocator.rowIdx + 1;
  const colChildIdx1b = keyLocator.colIdx + 1;
  return (
    `ol.keyboard > li:nth-child(${rowChildIdx1b})` +
    ` ol.keyboard-row > li:nth-child(${colChildIdx1b}) button`
  );
}

////////////////////////////////////////////////////////////////////////

type FocusableAreaKind =
  | "help-sidebar"
  | "actor-property-tab"
  | "flat-code-tab"
  | "script"
  | "script-code"
  | "hat-block-option"
  | "msg-rcvd-input"
  | "hat-block-cancel-button"
  | "key-pressed-dropdown"
  | "key-pressed-option"
  | "key-pressed-cancel-button"
  | "add-script-button"
  | "add-sprite-button"
  | "add-appearance-button"
  | "add-sound-button"
  | "add-flat-asset-button"
  | "actor-card"
  | "actor-card-menu-item"
  | "appearance-card"
  | "appearance-card-menu-item"
  | "sound-card"
  | "medialib-tag"
  | "medialib-entry"
  | "medialib-cancel-button"
  | "flat-asset"
  | "stage"
  | "progress-node"
  | "tutorial-content"
  | "activity-tab";

export function assertFocus(
  area: "help-sidebar" | "actor-card-menu-item" | "appearance-card-menu-item",
  locWithinArea: Array<number>
): void;

export function assertFocus(
  area: "activity-tab",
  locWithinArea: ActivityBarTabKey
): void;

export function assertFocus(
  area: "actor-property-tab",
  locWithinArea: ActorPropertiesTabKey
): void;

export function assertFocus(
  area:
    | "script"
    | "script-code"
    | "medialib-tag"
    | "medialib-entry"
    | "flat-asset"
    | "hat-block-option"
    | "actor-card"
    | "appearance-card"
    | "sound-card"
    | "progress-node",
  locWithinArea: number
): void;

export function assertFocus(
  area:
    | "flat-code-tab"
    | "key-pressed-cancel-button"
    | "add-script-button"
    | "add-sprite-button"
    | "add-appearance-button"
    | "add-sound-button"
    | "add-flat-asset-button"
    | "msg-rcvd-input"
    | "hat-block-cancel-button"
    | "key-pressed-dropdown"
    | "medialib-cancel-button"
    | "tutorial-content"
    | "stage",
  locWithinArea: void
): void;

export function assertFocus(
  area: "key-pressed-option",
  locWithinArea: string
): void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertFocus(area: FocusableAreaKind, locWithinArea: any): void {
  const inc = (x: number) => x + 1;

  const selector = (() => {
    switch (area) {
      case "help-sidebar": {
        const idxPath = locWithinArea as Array<number>;
        switch (idxPath.length) {
          case 1: {
            const childIdx1b = idxPath[0] + 1;
            return `.HelpSidebar details:nth-child(${childIdx1b}) > summary`;
          }
          case 2: {
            return helpEntrySelector(idxPath[0], idxPath[1]);
          }
          default: {
            const pathJson = JSON.stringify(idxPath);
            throw new Error(`bad locWithinArea ${pathJson} of "help-sidebar"`);
          }
        }
      }
      case "activity-tab": {
        const tabKey = locWithinArea as ActivityBarTabKey;
        return `.activity-bar-tabs button[data-activity-bar-tab="${tabKey}"]`;
      }
      case "actor-property-tab": {
        const tabKey = locWithinArea as ActorPropertiesTabKey;
        // This might be brittle.  We depend on the data attribute that
        // React Bootstrap uses.  If this breaks annoyingly often, we
        // can add our own data attribute for testability.
        return (
          ".Junior-ActorProperties-container ul" +
          ` button[data-rr-ui-event-key="${tabKey}"]`
        );
      }
      case "flat-code-tab": {
        return ".CodeEditor ul.nav-tabs li:first-child button";
      }
      case "script": {
        const scriptIdx = locWithinArea as number;
        const childIdx1b = scriptIdx + 1;
        return (
          ".Junior-ScriptsEditor ol" +
          ` li:nth-child(${childIdx1b}) > div[role="button"]`
        );
      }
      case "script-code": {
        const scriptIdx = locWithinArea as number;
        const childIdx1b = scriptIdx + 1;
        return (
          ".Junior-ScriptsEditor ol" +
          ` li:nth-child(${childIdx1b}) > div[role="button"] textarea`
        );
      }
      case "hat-block-option": {
        const hatIdx = locWithinArea as number;
        const childIdx1b = hatIdx + 1;
        return `li.EventKindOption:nth-child(${childIdx1b})`;
      }
      case "msg-rcvd-input": {
        return (
          'li.EventKindOption[data-event-handler-kind="message-received"]' +
          " input"
        );
      }
      case "hat-block-cancel-button": {
        return ".UpsertHandlerModal .modal-footer button:first-child";
      }
      case "key-pressed-dropdown": {
        return "div.KeyEditor";
      }
      case "key-pressed-option": {
        const keyBrowserName = locWithinArea as string;
        return keyPressedOptionSelector(keyBrowserName);
      }
      case "key-pressed-cancel-button": {
        return ".KeyChoiceModal .modal-footer button:first-child";
      }
      case "add-script-button": {
        return ".Junior-CodeEditor button.AddSomethingButton-container";
      }
      case "add-sprite-button": {
        return ".Junior-ActorsList-container button.AddSomethingButton-container";
      }
      case "add-appearance-button": {
        return (
          ".Junior-AppearancesList-container" +
          " button.AddSomethingButton-container:first-child"
        );
      }
      case "add-sound-button": {
        return ".Junior-SoundsList-container button.AddSomethingButton-container";
      }
      case "add-flat-asset-button": {
        return ".AssetCardPane-container .AddSomethingButton-container:first-child";
      }
      case "actor-card": {
        const actorIdx = locWithinArea as number;
        const childIdx1b = actorIdx + 1;
        return `ol.ActorsList li:nth-child(${childIdx1b}) div.focus-group__item`;
      }
      case "actor-card-menu-item": {
        const indexes = locWithinArea as Array<number>;
        if (indexes.length !== 2)
          throw new Error(`bad array length for "${area}"`);

        const [actorChildIdx1b, itemChildIdx1b] = indexes.map(inc);
        return (
          `ol.ActorsList li:nth-child(${actorChildIdx1b})` +
          ` div.show.dropdown a.dropdown-item:nth-of-type(${itemChildIdx1b})`
        );
      }
      case "appearance-card": {
        const appearanceIdx = locWithinArea as number;
        const childIdx1b = appearanceIdx + 1;
        return (
          `.Junior-AppearancesList-container ol.Junior-AssetsList` +
          ` li:nth-child(${childIdx1b}) div.focus-group__item`
        );
      }
      case "appearance-card-menu-item": {
        const indexes = locWithinArea as Array<number>;
        if (indexes.length !== 2)
          throw new Error(`bad array length for "${area}"`);

        const [appearanceChildIdx1b, itemChildIdx1b] = indexes.map(inc);
        return (
          "ol.Junior-AssetsList.asset-kind-image" +
          ` li:nth-child(${appearanceChildIdx1b})` +
          ` div.show.dropdown a.dropdown-item:nth-of-type(${itemChildIdx1b})`
        );
      }
      case "sound-card": {
        const soundIdx = locWithinArea as number;
        const childIdx1b = soundIdx + 1;
        return (
          `.Junior-SoundsList-container ol.Junior-AssetsList` +
          ` li:nth-child(${childIdx1b}) div.focus-group__item`
        );
      }
      case "medialib-tag": {
        const tagIdx = locWithinArea as number;
        const childIdx1b = tagIdx + 1;
        return (
          `ul.ClipArtTagButtonCollection` +
          ` li:nth-child(${childIdx1b}) button`
        );
      }
      case "medialib-entry": {
        const entryIdx = locWithinArea as number;
        const childIdx1b = entryIdx + 1;
        return (
          `ul.ClipArtEntriesList` +
          ` li:nth-child(${childIdx1b}) div.clipart-card`
        );
      }
      case "medialib-cancel-button": {
        return ".clipart-footer button:first-child";
      }
      case "flat-asset": {
        const assetIdx = locWithinArea as number;
        const childIdx1b = assetIdx + 1;
        return `.AssetCardList *:nth-child(${childIdx1b})`;
      }
      case "stage": {
        return "#pytch-speech-bubbles";
      }
      case "progress-node": {
        const chapIdx = locWithinArea as number;
        return `.progress-node-hover-target[data-chapter-index="${chapIdx}"]`;
      }
      case "tutorial-content": {
        return ".Junior-LessonContent";
      }
      default:
        return assertNever(area);
    }
  })();

  cy.get(selector).should("have.focus");
}
