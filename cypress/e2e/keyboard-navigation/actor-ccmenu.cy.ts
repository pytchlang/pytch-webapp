import {
  selectSprite,
  selectStage,
} from "../junior/utils";

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
});
