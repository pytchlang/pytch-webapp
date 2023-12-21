/// <reference types="cypress" />

const initIntercept = () => {
  cy.intercept({ pathname: "ok.txt" }, { body: "OK\n" }).as("ok-endpoint");
};

const awaitInstrumentationEvent = () =>
  cy.wait("@ok-endpoint").its("request.query").should("have.property", "evt");

context("Send anonymous instrumentation events", () => {
  it("sends start-up event", () => {
    initIntercept();
    cy.visit("/");
    awaitInstrumentationEvent().should("equal", "render");
  });
});
