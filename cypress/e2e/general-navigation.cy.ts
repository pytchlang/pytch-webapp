/// <reference types="cypress" />

context("General site navigation", () => {
  it("handles unknown pages within app", () => {
    cy.visit("/no-such-route-blah-blah");
    cy.contains("Sorry, we could not find that page");
    cy.contains("Pytch homepage").click();
    cy.contains("Pytch is a bridge");
  });

  it("can navigate to My Projects way-of-using-pytch", () => {
    cy.visit("/");
    cy.get(".way-of-using-pytch")
      .find("button")
      .contains("My projects")
      .click();
    cy.get("h1").contains("My projects");
    cy.get(".title-and-version h1").contains("Pytch").click();
    cy.contains("bridge from Scratch to Python");
  });

  it("can navigate to Tutorials way-of-using-pytch", () => {
    cy.visit("/");
    cy.get(".way-of-using-pytch").find("button").contains("Tutorials").click();
    cy.get("h1").contains("Tutorials");
    cy.get(".title-and-version h1").contains("Pytch").click();
    cy.contains("bridge from Scratch to Python");
  });

  it("handles uncaught exceptions", () => {
    // In dev mode, React still thinks the exception is unhandled, so
    // tell it to ignore uncaught exceptions:
    cy.on("uncaught:exception", () => false);

    const detail = "oh-no-something-went-wrong";
    cy.visit(`/deliberate-failure/${detail}`);
    cy.get(".ExceptionDisplay").contains(detail);
  });
});
