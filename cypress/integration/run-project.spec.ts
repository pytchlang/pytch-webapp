/// <reference types="cypress" />

context("Build and run projects", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("can print hello world", () => {
    cy.pytchBuildCode(`
      import pytch
      print("Hello world")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchStdoutShouldContain("Hello world\n");
  });
});
