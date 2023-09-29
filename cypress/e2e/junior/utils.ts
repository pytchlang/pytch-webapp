import {
  ActorKind,
  StructuredProgram,
} from "../../../src/model/junior/structured-program";
import { deIndent } from "../../common/utils";

export const selectSprite = (spriteName: string) =>
  cy.get(".ActorCard .label").contains(spriteName).click();

export const selectStage = () =>
  cy.get(".ActorCard .label").contains("Stage").click();

function selectPanelTab(containerClass: string, tabMatch: string) {
  cy.get(`.${containerClass} .nav-item`).as("tabs").contains(tabMatch).click();
  cy.get("@tabs")
    .find("button.active")
    .should("have.length", 1)
    .contains(tabMatch);
}

export function selectActorAspect(
  tabLabel: "Code" | "Costumes" | "Backdrops" | "Sounds"
) {
  selectPanelTab("Junior-ActorProperties-container", tabLabel);
}

export function selectInfoPane(tabLabel: "Output" | "Errors") {
  selectPanelTab("Junior-InfoPanel-container", tabLabel);
}

function assertInnerTexts(selector: string, expInnerTexts: Array<string>) {
  if (expInnerTexts.length === 0) {
    cy.get(selector).should("not.exist");
  } else {
    cy.get(selector).then((elts: JQuery<HTMLElement>) => {
      const gotInnerTexts = elts.toArray().map((b) => b.innerText);
      expect(gotInnerTexts).eql(expInnerTexts);
    });
  }
}

export const assertAspectTabLabels = (expLabels: Array<string>) =>
  assertInnerTexts(
    ".Junior-ActorProperties-container .nav-item button",
    expLabels
  );

export const assertHatBlockLabels = (expLabels: Array<string>) =>
  assertInnerTexts(".PytchScriptEditor .HatBlock .body .content", expLabels);

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

export const assertCostumeNames = (expNames: Array<string>) =>
  assertAppearanceNames("sprite", expNames);

export const assertBackdropNames = (expNames: Array<string>) =>
  assertAppearanceNames("stage", expNames);

export const assertSoundNames = (
  actorKind: ActorKind,
  expNames: Array<string>
) => assertAssetNames(actorKind, "sound", expNames);

export const assertActorNames = (expNames: Array<string>) =>
  assertInnerTexts(".ActorsList .ActorCard .label", expNames);

export const clickUniqueButton = (match: string) =>
  cy.get("button").contains(match).should("have.length", 1).click();

export function settleModalDialog(buttonMatch: string): void;
export function settleModalDialog(settleAction: () => void): void;
export function settleModalDialog(
  buttonMatch_or_settleAction: string | (() => void)
): void {
  const settleAction =
    typeof buttonMatch_or_settleAction === "string"
      ? () => clickUniqueButton(buttonMatch_or_settleAction)
      : buttonMatch_or_settleAction;

  cy.assertCausesToVanish(".modal-dialog", settleAction);
}

export const elementIsVisible = (elem: HTMLElement) =>
  elem.getClientRects().length > 0;

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
