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

  it("can re-build a project with sound", () => {
    cy.pytchBuildCode(`
      import pytch

      class Siren(pytch.Sprite):
        Costumes = []
        Sounds = [("noise", "sine-1kHz-2s.mp3")]

        def __init__(self):
          pytch.Sprite.__init__(self)
          print("making a Siren")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchStdoutShouldContain("Siren");

    cy.pytchBuild();
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchStdoutShouldContain("Siren");
  });
});
