/// <reference types="cypress" />

context("Interact with a tutorial", () => {
  beforeEach(() => {
    cy.pytchProjectFollowingTutorial();
  });

  it("can navigate through tutorial", () => {
    cy.contains("Next:").click();
    cy.get(".ToC > li.active")
      .should("have.length", 1)
      .contains("Make the playing area");
    cy.contains("Back:").click();
    cy.get(".ToC > li.active")
      .should("have.length", 1)
      .contains("Make a Pong-like game");
    cy.contains("Next:").click();
    cy.contains("Next:").click();
    cy.contains("Next:").click();
    cy.get(".ToC > li.active")
      .should("have.length", 1)
      .contains("Add the ball");
  });

  it("gives feedback when Copy button clicked", () => {
    cy.contains("Next:").click();
    cy.contains("Next:").click();
    cy.contains("COPY").click();
    cy.contains("Copied!");
    cy.waitUntil(() => cy.contains("Copied!").should("not.be.visible"));
  });
});

context("Demo of a tutorial", () => {
  beforeEach(() => {
    cy.pytchProjectDemonstratingTutorial();
  });

  it("creates project and launches IDE", () => {
    cy.get("nav.InfoPanel").within(() => {
      cy.contains("Tutorial").should("not.exist");
    });
    cy.contains("images and sounds");
  });

  it("launches button tour for demo", () => {
    cy.contains("Click the BUILD button");
    cy.pytchBuild();
    cy.contains("Click the BUILD button").should("not.exist");
    cy.contains("Click the green flag");
    cy.pytchGreenFlag();
    cy.contains("Click the green flag").should("not.exist");

    // Quick!  Before the ball hits the bat and makes a noise!
    cy.pytchRedStop();
  });
});
