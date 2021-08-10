/// <reference types="cypress" />

context("Joining and signing out of a study", () => {
  const apiBase = Cypress.env("STUDY_API_BASE");

  if (apiBase == null) {
    it("skipped — Cypress env.var STUDY_API_BASE not set", () => {});
    return;
  }

  let backendSpecs = [{ key: "stubbed", intercept: cy.intercept }];

  let validStudyCode = "11111111-2222-3333-4444-555555555555";
  let validParticipantCode = "abcd-efgh";

  const rawLocalhostCodes = Cypress.env("STUDY_API_TEST_VALID_CODES");
  if (rawLocalhostCodes != null) {
    [validStudyCode, validParticipantCode] = rawLocalhostCodes.split(":");
    backendSpecs.push({ key: "localhost", intercept: () => null });
  }

  backendSpecs.forEach((backendSpec) => {
    context(backendSpec.key, () => {
    });
  });
});
