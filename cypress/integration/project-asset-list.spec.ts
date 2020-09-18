/// <reference types="cypress" />

context("Management of project assets", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
    cy.contains("Images and sounds").click();
  });

  const initialAssets = ["red-rectangle-80-60.png", "sine-1kHz-2s.mp3"];

  it("shows project assets", () => {
    cy.pytchShouldShowAssets(initialAssets);
  });
});
