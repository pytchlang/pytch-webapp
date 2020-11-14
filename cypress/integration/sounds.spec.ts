/// <reference types="cypress" />

context("Playing sounds", () => {
  const silenceAsset = [{ name: "silence-500ms.mp3", mimeType: "audio/mpeg" }];

  before(() => {
    cy.pytchExactlyOneProject(silenceAsset);
  });
});
