/// <reference types="cypress" />

import { stageHeight } from "../../src/constants";

context("Interact with code editor", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  beforeEach(() => cy.pytchBuildCode("\nimport pytch\n"));

  it("auto-completes top-level pytch attributes", () => {
    cy.get("#pytch-ace-editor").type("pytch.y_is_pr{ctrl} ");

    // This feels quite fragile but is working for now:
    cy.get(".ace_autocomplete").click();

    cy.pytchCodeTextShouldContain("pytch.key_is_pressed");
  });

  it("auto-completes Actor methods", () => {
    cy.get("#pytch-ace-editor").type("self.sound_until{ctrl} ");
    cy.get(".ace_autocomplete").click();
    cy.pytchCodeTextShouldContain("self.play_sound_until_done");
  });

  it("keeps code content when changing layout", () => {
    cy.get("#pytch-ace-editor").type("# HELLO WORLD{enter}");
    cy.get(".layout-icon.tall-code").click();
    cy.get("button.tall-code.btn-primary");
    cy.pytchCodeTextShouldContain("HELLO WORLD");
    cy.get(".layout-icon.wide-info").click();
    cy.get("button.wide-info.btn-primary");
    cy.pytchCodeTextShouldContain("HELLO WORLD");
  });

  it("indicates when unsaved changes exist", () => {
    cy.get("button").contains("Save").parent().as("save-btn");
    cy.get("@save-btn").should("have.class", "no-changes-since-last-save");
    cy.get("#pytch-ace-editor").type("# HELLO{enter}");
    cy.get("@save-btn").should("have.class", "unsaved-changes-exist");
    cy.get("@save-btn").click();
    cy.get("@save-btn").should("have.class", "no-changes-since-last-save");
    cy.get("#pytch-ace-editor").type("# WORLD{enter}");
    cy.get("@save-btn").should("have.class", "unsaved-changes-exist");
    cy.get("button").contains("BUILD").click();
    cy.get("@save-btn").should("have.class", "no-changes-since-last-save");

    // This change will get lost; would be good to improve this part of
    // the user experience.
    cy.get("#pytch-ace-editor").type("# (again){enter}");
    cy.get("@save-btn").should("have.class", "unsaved-changes-exist");

    cy.contains("MyStuff").click();
    cy.pytchOpenProject("Test seed");

    // Re-find the button; it seems likely that we get a new element on
    // a fresh render of the IDE.
    cy.get("button")
      .contains("Save")
      .parent()
      .should("have.class", "no-changes-since-last-save");
  });
});

context("Drag vertical resizer", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
  });

  [
    { resizeDelta: 50, expectedEffectiveDelta: 50 },
    { resizeDelta: -50, expectedEffectiveDelta: -50 },
    // The following two have to match the clamping performed in
    // VerticalResizer.onTouchMove().
    { resizeDelta: -200, expectedEffectiveDelta: -stageHeight / 2 },
    { resizeDelta: +200, expectedEffectiveDelta: stageHeight / 4 },
  ].forEach((spec) =>
    it(`can drag vertical UI divider by ${spec.resizeDelta}`, () => {
      cy.pytchDragStageDivider(spec.resizeDelta);

      cy.get("#pytch-canvas")
        .invoke("height")
        .should("eq", stageHeight + spec.expectedEffectiveDelta);
    })
  );
});
