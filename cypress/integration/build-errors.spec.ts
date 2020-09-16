/// <reference types="cypress" />

context("Build errors", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("gives build error if typo", () => {
    cy.pytchBuildCode(`
      import pytch
      pront("oh no!")
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard("NameError");
  });

  it("gives build error if bad costume", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = [('yellow', 'no-such-file.png', 10, 10)]
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard(
      /PytchAssetLoadError.*Image "no-such-file.png"/
    );
  });

  it("gives build error if bad sound", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = []
          Sounds = [('splat', 'no-such-file.mp3')]
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard(
      /PytchAssetLoadError.*Sound "no-such-file.mp3"/
    );
  });

  it("gives syntax error without import pytch", () => {
    cy.pytchBuildCode(`
      print("hello world")
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard(/SyntaxError.*import pytch/);
  });
});
