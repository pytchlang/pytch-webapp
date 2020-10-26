/// <reference types="cypress" />

context("Python 3 features", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("can use print as a function", () => {
    cy.pytchBuildCode(`
      import pytch
      print("Hello", "world")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchStdoutShouldContain("Hello world\n");
  });

  it("can use f-strings", () => {
    cy.pytchBuildCode(`
      import pytch
      greeting = "Hello"
      print(f"{greeting} world")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchStdoutShouldContain("Hello world\n");
  });
});
