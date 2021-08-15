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
    cy.contains("Click the green flag");
    cy.contains("MyStuff").click();
    cy.contains("This project is a demo").click();
    cy.get(".cypress-helper-hide").should("have.length.at.least", 1);
    cy.get(".pytch-tooltip").should("not.exist");
  });

  it("dismisses button tour when creating tutorial", () => {
    cy.contains("Click the green flag");
    cy.contains("MyStuff").click();
    cy.get(".NavBar").contains("Tutorials").click();
    cy.contains("Boing")
      .parent()
      .within(() => {
        cy.contains("Learn how to make").click();
      });
    cy.contains("images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.get(".cypress-helper-hide").should("have.length.at.least", 1);
    cy.get(".pytch-tooltip").should("not.exist");
  });
});

context("Work with suggested tutorials", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  it("Shows suggested tutorial card", () => {
    cy.visit("/suggested-tutorial/boing");
    cy.contains("Pong-like game");
    cy.get(".TutorialCard").should("have.length", 1);
  });

  it("Allows trying suggested project", () => {
    cy.visit("/suggested-tutorial/boing");
    cy.contains("Try this project").click();
    cy.contains("Images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.contains("class BoingBackground");
    cy.contains("Tutorial").should("not.exist");
  });

  it("Allows tutorial of suggested project", () => {
    cy.visit("/suggested-tutorial/boing");
    cy.contains("Learn how to make").click();
    cy.contains("Images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.contains("Make a Pong-like game");
  });

  it("Handles non-existent suggested project", () => {
    cy.visit("/suggested-tutorial/no-such-tutorial");
    cy.contains("Sorry");
    cy.contains("See all tutorials");
  });

  it("Has working see-all-tutorials button", () => {
    cy.visit("/suggested-tutorial/boing");
    cy.contains("See all tutorials").click();
    cy.contains("Frogger-like game");
  });
});
