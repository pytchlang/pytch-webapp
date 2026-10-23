/// <reference types="cypress" />

import { stageFullScreenBorderPx } from "../../src/constants";

context("Full-screen layout", () => {
  const goFullScreen = () => {
    cy.get(".StageControls .full-screen").click();
  };

  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("enters and leaves full-screen layout", () => {
    goFullScreen();
    cy.get(".CodeEditor").should("not.exist");
    cy.get(".Junior-InfoPanel").should("not.exist");

    cy.get(".leave-full-screen").click();
    cy.get(".CodeEditor");
    cy.get(".Junior-InfoPanel");
  });

  it("moves focus to stage, and back to button", () => {
    const assertEnterButtonFocused = () =>
      cy.get(".StageControls button.full-screen").should("be.focused");

    goFullScreen();
    cy.get("#pytch-speech-bubbles").should("be.focused");
    cy.realPress("Escape");
    cy.get(".CodeEditor");
    assertEnterButtonFocused();

    goFullScreen();
    cy.get("#pytch-speech-bubbles").should("be.focused");
    cy.get(".leave-full-screen").click();
    cy.get(".CodeEditor");
    assertEnterButtonFocused();
  });

  [
    {
      label: "height-constrained",
      size: [800, 600],
      attr: "height",
      // TODO: Replace this "36" and "8" with constants:
      expValue: 600 - 36 - 8 - 2 * stageFullScreenBorderPx,
    },
    {
      label: "width-constrained",
      size: [590, 720],
      attr: "width",
      expValue: 590 - 2 * stageFullScreenBorderPx,
    },
  ].forEach((spec) => {
    it(`resizes stage in ${spec.label} full-screen layout`, () => {
      goFullScreen();
      cy.get(".CodeEditor").should("not.exist");
      cy.viewport(spec.size[0], spec.size[1]);
      cy.get("#pytch-canvas").its(`0.${spec.attr}`).should("eq", spec.expValue);
      cy.get(".leave-full-screen").click();
      cy.get(".CodeEditor");
    });
  });

  const assertNonFullscreenWithError = (errorMatch: RegExp) => {
    cy.get(".CodeEditor");
    cy.get(".Junior-InfoPanel");
    cy.get(".ActivityBar");
    cy.pytchShouldShowErrorCard(errorMatch, "user-space");
    cy.get(".ErrorReportPane").should("be.focused");
  };

  it("exits full-screen if build error", () => {
    cy.pytchSetCodeWithDeIndent(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = []
          Sounds = [('splat', 'no-such-file.mp3')]
    `);
    goFullScreen();
    cy.pytchBuild();

    assertNonFullscreenWithError(/could not load Sound/);
  });

  it("exits full-screen if runtime error", () => {
    cy.pytchSetCodeWithDeIndent(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = []

          @pytch.when_green_flag_clicked
          def erk(self):
              print(1/0)
    `);
    goFullScreen();
    cy.pytchBuild();

    assertNonFullscreenWithError(/division by zero/);
  });

  it("exits full-screen if rendering error", () => {
    cy.pytchSetCodeWithDeIndent(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]
        give_error = False

        @property
        def _x(self):
          if self.give_error:
            raise RuntimeError("oh no")
          else:
            return 0

        @_x.setter
        def _x(self, x):
          pass

        @pytch.when_key_pressed("x")
        def cause_trouble(self):
          self.give_error = True
      `);

    goFullScreen();
    cy.pytchBuild();

    cy.pytchSendKeysToProject("x");

    assertNonFullscreenWithError(/oh no/);
  });

  it("exits full-screen if variable-watcher error", () => {
    cy.pytchSetCodeWithDeIndent(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]

        @property
        def bad_property(self):
          raise RuntimeError("oh no")

        @pytch.when_key_pressed("x")
        def cause_trouble(self):
          pytch.show_variable(self, "bad_property")
      `);

    // Build before going full-screen, to replace the previous test's
    // project; otherwise, that project's rendering error would happen
    // as soon as we enter full-screen, sending us straight back to the
    // IDE.
    cy.pytchBuild();
    goFullScreen();
    cy.pytchBuild();
    cy.get(".FullScreenLayout");

    cy.pytchSendKeysToProject("x");

    assertNonFullscreenWithError(/oh no/);
  });

  it("navigating to project exits full-screen", () => {
    goFullScreen();
    cy.get(".AssetCardPane").should("not.exist");
    cy.go("back");
    cy.contains("Test seed project").click();
    cy.get(".AssetCardPane");
  });
});
