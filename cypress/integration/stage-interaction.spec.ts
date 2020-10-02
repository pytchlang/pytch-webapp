/// <reference types="cypress" />

context("Interaction with the stage", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
  });

  it("directs mouse clicks to stage after build", () => {
    cy.pytchBuildCode(`
      import pytch

      class Monitor(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]
        @pytch.when_this_sprite_clicked
        def say_hello(self):
          print("hello")
    `);

    // Just build, to emulate user interaction just with "BUILD" button,
    // rather than the user then clicking on the Errors tab to check for
    // errors, which is what pytchShouldHaveBuiltWithoutErrors() would
    // do.
    cy.pytchBuild();

    // The sprite is in the centre of the stage, so should receive this
    // click:
    cy.focused().click("center");

    cy.pytchStdoutShouldContain("hello\n");
  });
});
