/// <reference types="cypress" />

context("Build and run projects", () => {
  before(() => {
    cy.pytchExactlyOneProject("Test project");
  });

  it("can print hello world", () => {
    buildCode(`
      import pytch
      print("Hello world")
    `);
    stdoutShouldContain("Hello world\n");
  });
});
