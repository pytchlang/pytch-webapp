import {
  ActorKind,
} from "../../../src/model/junior/structured-program";

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
