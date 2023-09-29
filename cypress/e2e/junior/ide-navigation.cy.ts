import {
  assertAspectTabLabels,
  selectActorAspect,
  selectInfoPane,
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

  it("activates correct actor-aspect tabs", () => {
    selectSprite("Snake");

    for (let i = 0; i !== 3; ++i) {
      selectActorAspect("Code");
      cy.contains("self.say_for_seconds").should("be.visible");

      selectActorAspect("Costumes");
      cy.contains("python-logo.png").should("be.visible");

      selectActorAspect("Sounds");
      cy.contains("has no sounds yet").should("be.visible");
    }
  });

  it("activates correct info-pane tabs", () => {
    for (let i = 0; i !== 3; ++i) {
      selectInfoPane("Output");
      cy.contains("Anything your program prints");

      selectInfoPane("Errors");
      cy.contains("Any errors your project encounters");
    }
  });
});
