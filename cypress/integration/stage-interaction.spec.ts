/// <reference types="cypress" />

context("Interaction with the stage", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
  });

  const clickSpecs = [
    {
      label: "after just build",
      furtherAction: () => {},
    },
    {
      label: "after build then green-flag",
      furtherAction: () => cy.pytchGreenFlag(),
    },
    {
      label: "after build then red-stop",
      furtherAction: () => cy.pytchRedStop(),
    },
  ];

  clickSpecs.forEach((spec) =>
    it(`directs mouse clicks to stage (${spec.label})`, () => {
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

      spec.furtherAction();

      // The sprite is in the centre of the stage, so should receive this
      // click:
      cy.focused().click("center");
      cy.pytchStdoutShouldContain("hello\n");

      // Just inside top-left of 80x60 sprite centred on stage should
      // result in additional output:
      cy.focused().click(201, 151);
      cy.pytchStdoutShouldContain("hello\nhello\n");

      // Just OUTside top-left of 80x60 sprite centred on stage should
      // NOT result in any more output:
      cy.focused().click(199, 149);
      cy.pytchStdoutShouldContain("hello\nhello\n");
    })
  );
});
