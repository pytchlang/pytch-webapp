/// <reference types="cypress" />

context("Build errors", () => {
  before(() => {
    cy.pytchExactlyOneProject("Project with build errors");
  });

  it("gives build error if typo", () => {
    cy.pytchBuildCode(`
      import pytch
      pront("oh no!")
    `);

    cy.pytchShouldShowErrorCard("NameError");
  });

  it("gives build error if bad costume", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = [('yellow', 'no-such-file.png', 10, 10)]
    `);

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

    cy.pytchShouldShowErrorCard(
      /PytchAssetLoadError.*Sound "no-such-file.mp3"/
    );
  });
});
