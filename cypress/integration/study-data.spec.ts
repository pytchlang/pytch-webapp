/// <reference types="cypress" />

import { SAVED_SESSION_TOKEN_KEY } from "../../src/model/study-session";

context("Joining and signing out of a study", () => {
  const apiBase = Cypress.env("STUDY_API_BASE");

  if (apiBase == null) {
    it("skipped — Cypress env.var STUDY_API_BASE not set", () => {});
    return;
  }

  const disableDelays = (window: any) => {
    window.PYTCH_CYPRESS.instantDelays = true;
  };

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
      const successfulRequestSessionResponse = {
        status: "ok",
        token: "seekr1T",
      };
      const unsuccessfulRequestSessionResponse = {
        status: "rejected",
      };
      const successfulSessionInvalidationResponse = {
        status: "ok",
        nInvalidated: 1,
      };
      const successfulHeartbeatResponse = {
        status: "ok",
        atime: "2021-01-01T00:00:00.000",
      };
      const unsuccessfulHeartbeatResponse = {
        status: "failed",
        reason: "NOT_FOUND",
      };

      const sessionsApiUrlBase = `${apiBase}/sessions`;

      ["click", "enter"].forEach((submitMethod) => {
        it(`can join and sign out of study (${submitMethod})`, () => {
          backendSpec.intercept(
            "POST",
            sessionsApiUrlBase,
            successfulRequestSessionResponse
          );
          backendSpec.intercept(
            "DELETE",
            `${sessionsApiUrlBase}/*`,
            successfulSessionInvalidationResponse
          );
          backendSpec.intercept(
            "POST",
            `${sessionsApiUrlBase}/*/heartbeat`,
            successfulHeartbeatResponse
          );

          cy.visit(`/join/${validStudyCode}`).then(disableDelays);
          cy.get("input").type(validParticipantCode);
          switch (submitMethod) {
            case "click":
              cy.get("button").click();
              break;
            case "enter":
              cy.get("input").type("{enter}");
              break;
          }
          cy.contains("successfully joined");
          cy.get("button").click();
          cy.contains("Pytch is a bridge");

          // Load a page outside within-app navigation mechanisms to
          // check behaviour wrt stored session-token
          cy.visit("/my-projects").then(disableDelays);
          cy.contains("Create a new project");

          cy.contains("Sign out of study").click();
          cy.contains("Thank you for taking part");
        });
      });

      if (backendSpec.key === "localhost") {
        it("rejects malformed study-code", () => {
          // No need to intercept since we know we're talking to
          // dev backend on localhost.
          cy.visit("/join/1234-5678").then(disableDelays);
          cy.get("input").type("aaaa-bbbb");
          cy.get("button").click();
          cy.contains("something went wrong");
        });
      }

      if (backendSpec.key === "stubbed") {
        [
          { label: "network error", response: { forceNetworkError: true } },
          { label: "bad JSON", response: "(not-real-JSON)" },
        ].forEach((spec) => {
          it(`shows message if ${spec.label}`, () => {
            // Definitely intercept since we know we're running stubbed.
            cy.intercept("POST", sessionsApiUrlBase, spec.response);

            cy.visit("/join/1234-5678").then(disableDelays);
            cy.get("input").type("aaaa-bbbb");
            cy.get("button").click();
            cy.contains("something went wrong");
          });
        });
      }

      it("allows retry if bad participant code", () => {
        backendSpec.intercept(
          "POST",
          sessionsApiUrlBase,
          unsuccessfulRequestSessionResponse
        );
        cy.visit(`/join/${validStudyCode}`).then(disableDelays);
        cy.get("input").type("bad-participant-code");
        cy.get("button").click();
        cy.contains("was not recognised");

        backendSpec.intercept(
          "POST",
          sessionsApiUrlBase,
          successfulRequestSessionResponse
        );
        cy.get("input").clear().type(validParticipantCode);
        cy.get("button").click();
        cy.contains("successfully joined");
        cy.contains("was not recognised").should("not.exist");
      });

      it("shows sorry-not-main-site message", () => {
        // (Cypress clears localStorage before each test, so we won't be
        // confused by a previous test leaving a valid session token in
        // localStorage.)
        cy.visit("/");
        cy.contains("please directly use the link");
      });

      it("rejects invalid stored session", () => {
        cy.visit("/").then((window) => {
          window.localStorage.setItem(
            SAVED_SESSION_TOKEN_KEY,
            "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
          );
        });
        backendSpec.intercept(
          "POST",
          `${sessionsApiUrlBase}/*/heartbeat`,
          unsuccessfulHeartbeatResponse
        );
        cy.contains("please directly use the link");
      });
    });
  });
});
