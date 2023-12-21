/// <reference types="cypress" />

const initIntercept = () => {
  cy.intercept({ pathname: "ok.txt" }, { body: "OK\n" }).as("ok-endpoint");
};

context("Send anonymous instrumentation events", () => {
});
