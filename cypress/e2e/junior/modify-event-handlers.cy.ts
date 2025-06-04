import { saveButton } from "../utils";
import {
  assertHatBlockLabels,
  loadFromZipfile,
  selectSprite,
  settleModalDialog,
  ScriptOps,
} from "./utils";

context("Modify/reorder event handlers", () => {
  it("drag-and-drop event handlers", () => {
    loadFromZipfile("per-method-four-scripts.zip");

    selectSprite("Snake");
    assertHatBlockLabels(ScriptOps.allExtendedHandlerLabels);
    saveButton.click();

    cy.get(".Junior-ScriptsEditor").as("editor");
    cy.get("@editor").contains("when green flag clicked").as("flag-clicked");
    cy.get("@editor").contains("when I receive").as("msg-rcvd");
    cy.get("@editor").contains("when I start as a clone").as("clone");
    cy.get("@editor").contains("when this sprite clicked").as("sprite-clicked");

    saveButton.shouldReactToInteraction(() => {
      cy.get("@sprite-clicked").drag("@clone");
    });
    assertHatBlockLabels(ScriptOps.someExtendedHandlerLabels([0, 1, 3, 2]));

    saveButton.shouldReactToInteraction(() => {
      cy.get("@sprite-clicked").drag("@flag-clicked");
    });
    assertHatBlockLabels(ScriptOps.someExtendedHandlerLabels([3, 0, 1, 2]));

    saveButton.shouldReactToInteraction(() => {
      cy.get("@msg-rcvd").drag("@flag-clicked");
    });
    assertHatBlockLabels(ScriptOps.someExtendedHandlerLabels([3, 1, 0, 2]));
  });

  it("can reorder event handlers with dropdown items", () => {
    cy.pytchBasicJrProject();

    const moveHandlerAndAssertLabels = (
      movingIdx: number,
      direction: "prev" | "next",
      expOrderAfterMove: Array<number>
    ) => {
      cy.get(".Junior-ScriptsEditor .HatBlock")
        .eq(movingIdx)
        .find(`.dropdown`)
        .click()
        .contains(direction === "prev" ? "script up" : "script down")
        .click();

      const expLabels = ScriptOps.someExtendedHandlerLabels(expOrderAfterMove);
      assertHatBlockLabels(expLabels);
    };

    saveButton.shouldReactToInteraction(() => {
      ScriptOps.addSomeHandlers();
    });

    saveButton.shouldReactToInteraction(() => {
      moveHandlerAndAssertLabels(1, "prev", [1, 0, 2, 3]);
    });

    saveButton.shouldReactToInteraction(() => {
      moveHandlerAndAssertLabels(1, "next", [1, 2, 0, 3]);
      moveHandlerAndAssertLabels(0, "next", [2, 1, 0, 3]);
    });

    saveButton.shouldReactToInteraction(() => {
      moveHandlerAndAssertLabels(2, "next", [2, 1, 3, 0]);
    });
  });

  it("can change hatblock with double-click", () => {
    cy.pytchBasicJrProject();

    ScriptOps.addHandler(() => ScriptOps.typeMessageValue("go for it"));
    saveButton.click();

    saveButton.shouldReactToInteraction(() => {
      cy.get(".HatBlock").contains('"go for it"').dblclick();
      cy.contains("when I start as a clone").click();
      settleModalDialog("OK");
    });

    assertHatBlockLabels([
      "when green flag clicked", // From sample
      "when I start as a clone",
    ]);
  });

  it("can change hatblock with dropdown item", () => {
    cy.pytchBasicJrProject();

    saveButton.shouldReactToInteraction(() => {
      ScriptOps.addHandler(() => ScriptOps.typeMessageValue("go for it"));
    });

    saveButton.shouldReactToInteraction(() => {
      ScriptOps.chooseHandlerDropdownItem(1, "Change hat block");

      cy.get("li.EventKindOption.chosen")
        .should("have.length", 1)
        .find("input")
        .should("have.value", "go for it");

      cy.get(".EventKindOption").contains("when this").click();
      settleModalDialog("OK");
    });

    assertHatBlockLabels([
      "when green flag clicked", // From sample
      "when this sprite clicked",
    ]);
  });
});
