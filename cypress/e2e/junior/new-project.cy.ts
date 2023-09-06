context("Create and edit per-method programs", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  it("can create from template", () => {
    cy.contains("My projects").click();
    cy.get("button").contains("Create new").click();
    cy.get("button").contains("Empty PytchJr").as("PJ-btn").click();
    cy.get("@PJ-btn").should("have.class", "btn-success");
    cy.get("button").contains("Create project").click();
    cy.get("div.Junior-ScriptsEditor");
    cy.get("div.modal.show").should("not.exist");
  });
});
