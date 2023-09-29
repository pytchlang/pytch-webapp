import {
  assertAspectTabLabels,
  selectSprite,
  selectStage,
} from "./utils";

context("Basic use of per-method IDE", () => {
  before(() => {
    cy.pytchBasicJrProject();
  });

  // These tests are all independent, so we can use the same IDE
  // instance throughout.

  it("shows correct actor-aspect tab labels", () => {
    selectStage();
    assertAspectTabLabels(["Code", "Backdrops", "Sounds"]);

    selectSprite("Snake");
    assertAspectTabLabels(["Code", "Costumes", "Sounds"]);
  });
});
