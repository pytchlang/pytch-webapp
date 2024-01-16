import {
  ActorKind,
  StructuredProgram,
} from "../../../src/model/junior/structured-program";
import { deIndent } from "../../common/utils";

import { IconName } from "@fortawesome/fontawesome-common-types";

/** Click on the Sprite with the given `spriteName`, thereby selecting
 * it. */
export const selectSprite = (spriteName: string) =>
  cy.get(".ActorCard .label").contains(spriteName).click();

/** Click on the Stage, thereby selecting it. */
export const selectStage = () =>
  cy.get(".ActorCard .label").contains("Stage").click();

function selectPanelTab(containerClass: string, tabMatch: string) {
  cy.get(`.${containerClass} .nav-item`).as("tabs").contains(tabMatch).click();
  cy.get("@tabs")
    .find("button.active")
    .should("have.length", 1)
    .contains(tabMatch);
}

/** Click on the given `tabLabel` within the Actor Aspects pane, thereby
 * selecting that tab.  */
export function selectActorAspect(
  tabLabel: "Code" | "Costumes" | "Backdrops" | "Sounds"
) {
  selectPanelTab("Junior-ActorProperties-container", tabLabel);
}

/** Click on the given `tabLabel` within the Information pane, thereby
 * selecting that tab.  */
export function selectInfoPane(tabLabel: "Output" | "Errors") {
  selectPanelTab("Junior-InfoPanel-container", tabLabel);
}

function innerTextsMatch(selector: string, expInnerTexts: Array<string>) {
  if (expInnerTexts.length === 0) {
    return cy
      .get(selector)
      .should("not.exist")
      .then(() => true);
  } else {
    return cy.get(selector).then((elts: JQuery<HTMLElement>) => {
      const gotInnerTexts = elts.toArray().map((b) => b.innerText);
      return (
        gotInnerTexts.length === expInnerTexts.length &&
        gotInnerTexts.every((text, idx) => text === expInnerTexts[idx])
      );
    });
  }
}

function assertInnerTexts(selector: string, expInnerTexts: Array<string>) {
  cy.waitUntil(() => innerTextsMatch(selector, expInnerTexts), {
    errorMsg: `exp ${expInnerTexts}`,
  });
}

/** Assert that the tabs within the Actor Aspects pane have the given
 * array `expLabels` of labels. */
export const assertAspectTabLabels = (expLabels: Array<string>) =>
  assertInnerTexts(
    ".Junior-ActorProperties-container .nav-item button",
    expLabels
  );

/** Assert that the Hat Blocks of the scripts within the editor have the
 * given array `expLabels` of labels. */
export const assertHatBlockLabels = (expLabels: Array<string>) =>
  assertInnerTexts(".PytchScriptEditor .HatBlock .body .content", expLabels);

/** Type the given `text` into the script editor at (zero-based) index
 * `scriptIndex`. */
export const typeIntoScriptEditor = (scriptIndex: number, text: string) =>
  cy.get(".PytchScriptEditor").eq(scriptIndex).find(".ace_editor").type(text);

const assertAssetNames = (
  actorKind: ActorKind,
  assetKind: "image" | "sound",
  expNames: Array<string>
) => {
  const actorCls = `actor-kind-${actorKind}`;
  const assetCls = `asset-kind-${assetKind}`;
  const assetListSelector = `.Junior-AssetsList.${actorCls}.${assetCls}`;
  const selector = `${assetListSelector} .AssetCard .label`;
  assertInnerTexts(selector, expNames);
};

const assertAppearanceNames = (
  actorKind: ActorKind,
  expLabels: Array<string>
) => assertAssetNames(actorKind, "image", expLabels);

/** Assert that the currently-selected actor is a Sprite, and that its
 * Costumes have the given array `expNames` as their names. */
export const assertCostumeNames = (expNames: Array<string>) =>
  assertAppearanceNames("sprite", expNames);

/** Assert that the currently-selected actor is the Stage, and that its
 * Backdrops have the given array `expNames` as their names. */
export const assertBackdropNames = (expNames: Array<string>) =>
  assertAppearanceNames("stage", expNames);

/** Assert that the currently-selected actor's Sounds have the given
 * array `expNames` as their names. */
export const assertSoundNames = (
  actorKind: ActorKind,
  expNames: Array<string>
) => assertAssetNames(actorKind, "sound", expNames);

/** Assert that the current collection of actors has the given array
 * `expNames` as its names. */
export const assertActorNames = (expNames: Array<string>) =>
  assertInnerTexts(".ActorsList .ActorCard .label", expNames);

/** Assert that there is exactly one button matching `match`, then click
 * it. */
export const clickUniqueButton = (match: string) =>
  cy.get("button").contains(match).should("have.length", 1).click();

export function settleModalDialog(buttonMatch: string): void;
export function settleModalDialog(settleAction: () => void): void;

/** Settle (i.e., proceed with or cancel) a modal dialog.  Assert that a
 * unique modal is currently showing, then 'settle' it based on the
 * given `buttonMatch_or_settleAction`.  If a string is given, assert
 * that a unique button with contents matching that string exists, and
 * then click it.  If a function is given, invoke that function.  Either
 * way, the modal should then cease to exist. */
export function settleModalDialog(
  buttonMatch_or_settleAction: string | (() => void)
): void {
  const settleAction =
    typeof buttonMatch_or_settleAction === "string"
      ? () => clickUniqueButton(buttonMatch_or_settleAction)
      : buttonMatch_or_settleAction;

  cy.assertCausesToVanish(".modal-dialog", settleAction);
}

/** Click the close button ("X") in the current modal dialog. */
export function clickHeaderCloseButton() {
  cy.get(".modal-header button.btn-close").click();
}

/** Compute whether the given `elem` is visible. */
export const elementIsVisible = (elem: HTMLElement) =>
  elem.getClientRects().length > 0;

/** Construct a `StructuredProgram` out of the given `protoProgram`.
 * Fudging the types, the given `protoProgram` must already be a
 * standard `StructuredProgram`, with the exception that the
 * `pythonCode` string of each `EventHandler` is allowed to have leading
 * blank lines, with the remaining lines having fixed arbitrary
 * indentation.  That fixed indentation is stripped to construct the
 * returned `StructuredProgram`.  (Any 'true' indentation in a
 * `pythonCode` string is preserved.) */
export const deIndentStructuredProgram = (
  protoProgram: StructuredProgram
): StructuredProgram => ({
  actors: protoProgram.actors.map((actor) => {
    const handlers = actor.handlers.map((handler) => {
      const pythonCode = deIndent(handler.pythonCode);
      return { ...handler, pythonCode };
    });
    return { ...actor, handlers };
  }),
});

/** Get (as Cypress subject) the activity-bar tab with the given `icon`.
 * */
export const getActivityBarTab = (icon: IconName) =>
  cy.get(`.ActivityBarTab .tabkey-icon svg[data-icon="${icon}"]`);
