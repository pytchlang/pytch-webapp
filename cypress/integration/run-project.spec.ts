/// <reference types="cypress" />

context("Build and run projects", () => {
  before(() => {
    cy.pytchExactlyOneProject("Test project");
  });

  it("can print hello world", () => {
    cy.pytchBuildCode(`
      import pytch
      print("Hello world")
    `);
    cy.pytchStdoutShouldContain("Hello world\n");
  });
});
