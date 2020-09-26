/// <reference types="cypress" />

context("Speech bubbles", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("shows a speech bubble", () => {
    cy.pytchBuildCode(`
      import pytch

      class Rectangle(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]

        @pytch.when_green_flag_clicked
        def go(self):
          self.go_to_xy(0, 24)
          self.say("Hello world!")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchGreenFlag();
    cy.get("div.speech-bubble").contains("Hello world!");
  });
});
