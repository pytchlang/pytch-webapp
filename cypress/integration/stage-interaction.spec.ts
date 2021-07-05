/// <reference types="cypress" />

context("Interaction with the stage", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
  });

  const clickSpecs = [
    {
      label: "after just build",
      furtherAction: () => {},
      extraOutput: "",
    },
    {
      label: "after build then green-flag",
      furtherAction: () => cy.pytchGreenFlag(),
      extraOutput: "bananas\n",
    },
    {
      label: "after build then red-stop",
      furtherAction: () => cy.pytchRedStop(),
      extraOutput: "",
    },
  ];

  clickSpecs.forEach((spec) =>
    it(`directs mouse clicks to stage (${spec.label})`, () => {
      cy.pytchBuildCode(`
        import pytch

        class Monitor(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]
          @pytch.when_green_flag_clicked
          def say_bananas(self):
            print("bananas")
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
      cy.pytchStdoutShouldEqual(`${spec.extraOutput}hello\n`);

      // Just inside top-left of 80x60 sprite centred on stage should
      // result in additional output:
      cy.focused().click(201, 151);
      cy.pytchStdoutShouldEqual(`${spec.extraOutput}hello\nhello\n`);

      // Just OUTside top-left of 80x60 sprite centred on stage should
      // NOT result in any more output:
      cy.focused().click(199, 149);
      cy.pytchStdoutShouldEqual(`${spec.extraOutput}hello\nhello\n`);
    })
  );

  [
    { label: "default-size", setupFun: () => {} },
    { label: "max-size", setupFun: () => cy.pytchDragStageDivider(200) },
    { label: "min-size", setupFun: () => cy.pytchDragStageDivider(-200) },
  ].forEach((spec) =>
    it(`computes click coords (${spec.label} stage)`, () => {
      spec.setupFun();

      cy.pytchBuildCode(`
        import pytch
        locations = [(x, y) for x in [-240, 240] for y in [-180, 180]]
        class Monitor(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]
          @pytch.when_green_flag_clicked
          def shrink(self):
            self.set_size(0.25)
            self.n_clicks = 0
            self.next_location_idx = 0
          @pytch.when_this_sprite_clicked
          def say_hello(self):
            self.n_clicks += 1
            print("hello", self.n_clicks, self.x_position, self.y_position)
          @pytch.when_key_pressed("m")
          def next_location(self):
            self.go_to_xy(*locations[self.next_location_idx])
            self.next_location_idx += 1
            print("moved", self.n_clicks)
    `);

      cy.pytchGreenFlag();
      cy.pytchClickStage(0, 0);
      cy.pytchStdoutShouldContain("hello 1 0 0\n");

      cy.pytchSendKeysToApp("m");
      cy.pytchStdoutShouldContain("moved 1\n");
      cy.pytchClickStage(-230, -170);
      cy.pytchClickStage(-239, -179);
      cy.pytchStdoutShouldContain("hello 2 -240 -180\n");

      cy.pytchSendKeysToApp("m");
      cy.pytchStdoutShouldContain("moved 2\n");
      cy.pytchClickStage(-230, 170);
      cy.pytchClickStage(-239, 179);
      cy.pytchStdoutShouldContain("hello 3 -240 180\n");

      cy.pytchSendKeysToApp("m");
      cy.pytchStdoutShouldContain("moved 3\n");
      cy.pytchClickStage(230, -170);
      cy.pytchClickStage(239, -179);
      cy.pytchStdoutShouldContain("hello 4 240 -180\n");

      cy.pytchSendKeysToApp("m");
      cy.pytchStdoutShouldContain("moved 4\n");
      cy.pytchClickStage(230, 170);
      cy.pytchClickStage(239, 179);
      cy.pytchStdoutShouldContain("hello 5 240 180\n");
    })
  );
});
