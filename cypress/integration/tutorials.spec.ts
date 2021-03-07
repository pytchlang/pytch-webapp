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
    cy.pytchRunThroughButtonTour();

    // Quick!  Before the ball hits the bat and makes a noise!
    cy.pytchRedStop();
  });

  it("dismisses button tour when project re-loaded", () => {
    cy.contains("Click the BUILD button");
    cy.pytchBuild();
    cy.contains("Click the BUILD button").should("not.exist");
    cy.contains("Click the green flag");
    cy.contains("MyStuff").click();
    cy.contains("This project is a demo").click();
    cy.get(".cypress-helper-hide").should("have.length.at.least", 1);
    cy.get(".pytch-tooltip").should("not.exist");
  });

  it("dismisses button tour when creating tutorial", () => {
    cy.contains("Click the BUILD button");
    cy.pytchBuild();
    cy.contains("Click the BUILD button").should("not.exist");
    cy.contains("Click the green flag");
    cy.contains("MyStuff").click();
    cy.get(".NavBar").contains("Tutorials").click();
    cy.contains("Boing")
      .parent()
      .within(() => {
        cy.contains("Learn how to make").click();
      });
    cy.get(".cypress-helper-hide").should("have.length.at.least", 1);
    cy.get(".pytch-tooltip").should("not.exist");
  });
});
