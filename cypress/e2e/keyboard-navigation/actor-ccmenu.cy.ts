import {
  selectSprite,
  selectStage,
  settleModalDialog,
} from "../junior/utils";
import { assertModalWithTitle } from "../utils";
import {
  assertFocus,
  chooseCcMenuItem,
  summonCcMenuByKbd,
} from "./utils";

context("Actor ccmenu operations", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const actorKindsAndSelectors = {
    stage: { actorKind: "stage", select: selectStage },
    sprite: { actorKind: "sprite", select: () => selectSprite("Snake") },
  };

  // Stage dropdown should have "rename" and "delete" disabled.
  const expStageEnabled = [true, true, true, false, false];
  const expSpriteEnabled = [true, true, true, true, true];
  [
    { ...actorKindsAndSelectors.stage, expEntriesEnabled: expStageEnabled },
    { ...actorKindsAndSelectors.sprite, expEntriesEnabled: expSpriteEnabled },
  ].forEach((spec) => {
    it(`correct items (en/dis)abled (${spec.actorKind})`, () => {
      spec.select();
      summonCcMenuByKbd();
      cy.get(".ActorCard a.dropdown-item").as("items").should("have.length", 5);
      spec.expEntriesEnabled.forEach((expEnabled, idx) => {
        const predicate = expEnabled ? "not.have.class" : "have.class";
        cy.get("@items").eq(idx).should(predicate, "disabled");
      });
    });
  });

  [
    { label: "rename", itemIndex: 3, modalHeaderMatch: "Rename Snake" },
    { label: "delete", itemIndex: 4, modalHeaderMatch: "Delete Snake?" },
  ].forEach((spec) => {
    it(`launch and cxl "${spec.label} sprite"`, () => {
      selectSprite("Snake");
      chooseCcMenuItem(spec.itemIndex);
      assertModalWithTitle(spec.modalHeaderMatch);
      settleModalDialog("Cancel");
      assertFocus("actor-card", 1);
    });
  });
});
