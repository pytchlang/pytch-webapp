/// <reference types="cypress" />

context("Work with pop-up diff help", () => {
  beforeEach(() => {
    cy.pytchProjectFollowingTutorial();
  });

  const diffSelector = (kind: string) =>
    `.modal-body .patch-container .diff-${kind}`;
});
