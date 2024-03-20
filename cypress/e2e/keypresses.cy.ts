/// <reference types="cypress" />

context("Keypress handling", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("responds to keypresses", () => {
    cy.pytchBuildCode(`
      import pytch

      class Rectangle(pytch.Sprite):
        Costumes = []

        @pytch.when_key_pressed("a")
        def say_hello(self):
          print("hello")
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("a");
    cy.pytchStdoutShouldContain("hello\n");
    cy.pytchSendKeysToProject("a");
    cy.pytchStdoutShouldContain("hello\nhello\n");

    cy.pytchSendKeysToApp("A");
    cy.pytchStdoutShouldContain("hello\nhello\nhello\n");

    cy.pytchRedStop();
    cy.pytchSendKeysToApp("a");
    cy.pytchStdoutShouldContain("hello\nhello\nhello\nhello\n");
    cy.pytchSendKeysToApp("A");
    cy.pytchStdoutShouldContain("hello\nhello\nhello\nhello\nhello\n");
  });
});
