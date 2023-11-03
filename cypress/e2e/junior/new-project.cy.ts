import { assertActorNames } from "./utils";

context("Create and edit per-method programs", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  [
    { buttonMatch: "Without example", expActors: ["Stage"] },
    { buttonMatch: "With example", expActors: ["Stage", "Snake"] },
  ].forEach((spec) =>
    it(`can create from template (${spec.buttonMatch})`, () => {
      cy.contains("My projects").click();
      cy.get("button").contains("Create new").click();

      cy.get("button").contains(spec.buttonMatch).as("example-btn").click();
      cy.get("@example-btn").should("have.class", "btn-success");

      cy.get("button").contains("as sprites and scripts").as("pjr-btn").click();
      cy.get("@pjr-btn").should("have.class", "btn-success");

      cy.get("button").contains("Create project").click();
      cy.get("div.Junior-ScriptsEditor");
      cy.get("div.modal.show").should("not.exist");

      assertActorNames(spec.expActors);
    })
  );
});
