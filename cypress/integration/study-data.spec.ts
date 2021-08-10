/// <reference types="cypress" />

context("Joining and signing out of a study", () => {
  const apiBase = Cypress.env("STUDY_API_BASE");

  if (apiBase == null) {
    it("skipped — Cypress env.var STUDY_API_BASE not set", () => {});
    return;
  }
});
