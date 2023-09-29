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

  it("expand/collapse help sidebar", () => {
    selectSprite("Snake");
    selectActorAspect("Code");

    cy.get(".Junior-HelpSidebarMachinery.collapsed .control").click();
    cy.get(".HelpSidebarSection.category-sound").should("be.visible");

    selectActorAspect("Sounds");
    // This is a bit brittle.  The sidebar elements still exist when you
    // switch tab.
    cy.get(".Junior-HelpSidebarMachinery").should("not.be.visible");

    selectActorAspect("Code");
    cy.get(".HelpSidebarSection.category-sound").should("be.visible");
    // This section is not relevant to PytchJr:
    cy.get(".HelpSidebarSection.category-events").should("not.exist");

    cy.get(".Junior-HelpSidebarMachinery.expanded .dismiss-help").click();
    cy.get(".Junior-HelpSidebarMachinery.collapsed");

    cy.get(".HelpSidebarSection.category-sound").should("not.exist");

    selectActorAspect("Sounds");
    cy.get(".Junior-HelpSidebarMachinery").should("not.be.visible");
  });
});
