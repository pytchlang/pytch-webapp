/// <reference types="cypress" />

import {
  stageWidth,
  stageHeight,
  stageFullScreenBorderPx,
} from "../../src/constants";

context("Full-screen layout", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("does not resize stage in IDE layout", () => {
    cy.get(".LayoutChooser button.wide-info").click().click();
    cy.viewport(800, 600);
    cy.get("#pytch-canvas").its("0.width").should("eq", stageWidth);
    cy.get("#pytch-canvas").its("0.height").should("eq", stageHeight);
  });

  it("enters and leaves full-screen layout", () => {
    cy.get(".LayoutChooser .full-screen").click();
    cy.get(".CodeEditor").should("not.exist");
    cy.get(".InfoPanel").should("not.exist");
    cy.get(".LayoutChooser").should("not.exist");

    cy.get(".leave-full-screen").click();
    cy.get(".CodeEditor");
    cy.get(".InfoPanel");
    cy.get(".LayoutChooser");
  });

  it("remembers IDE-layout stage dimensions", () => {
    // Click twice to ensure default stage size to start:
    cy.get(".LayoutChooser button.wide-info").click().click();
    cy.pytchDragStageDivider(50);
    cy.get("#pytch-canvas")
      .its("0.width")
      .then((width) => {
        cy.get("#pytch-canvas")
          .its("0.height")
          .then((height) => {
            cy.get(".LayoutChooser .full-screen").click();
            cy.get(".CodeEditor").should("not.exist");

            cy.get("#pytch-canvas").its("0.width").should("be.gt", width);
            cy.get("#pytch-canvas").its("0.height").should("be.gt", height);

            cy.get(".leave-full-screen").click();
            cy.get(".CodeEditor");

            cy.get("#pytch-canvas").its("0.width").should("eq", width);
            cy.get("#pytch-canvas").its("0.height").should("eq", height);
          });
      });
  });

  [
    {
      label: "height-constrained",
      size: [800, 600],
      attr: "height",
      // TODO: Replace this "40" with a constant:
      expValue: 600 - 40 - 2 * stageFullScreenBorderPx,
    },
    {
      label: "width-constrained",
      size: [590, 720],
      attr: "width",
      expValue: 590 - 2 * stageFullScreenBorderPx,
    },
  ].forEach((spec) => {
    it(`resizes stage in ${spec.label} full-screen layout`, () => {
      cy.get(".LayoutChooser button.wide-info").click().click();
      cy.get(".LayoutChooser button.full-screen").click();
      cy.get(".CodeEditor").should("not.exist");
      cy.viewport(spec.size[0], spec.size[1]);
      cy.get("#pytch-canvas").its(`0.${spec.attr}`).should("eq", spec.expValue);
      cy.get(".leave-full-screen").click();
      cy.get(".CodeEditor");
    });
  });

  const assertWideInfoWithError = (errorMatch: RegExp) => {
    cy.get("button.wide-info.btn-primary");
    cy.get(".CodeEditor");
    cy.get(".InfoPanel");
    cy.get(".LayoutChooser");
    cy.pytchShouldShowErrorCard(errorMatch, "user-space");
  };

  it("exits full-screen if build error", () => {
    cy.pytchSetCodeWithDeIndent(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = []
          Sounds = [('splat', 'no-such-file.mp3')]
    `);
    cy.get(".LayoutChooser .full-screen").click();
    cy.pytchBuild();

    assertWideInfoWithError(/could not load Sound/);
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
    cy.get(".LayoutChooser .full-screen").click();
    cy.pytchBuild();

    assertWideInfoWithError(/division by zero/);
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

    cy.get(".LayoutChooser .full-screen").click();
    cy.pytchBuild();

    cy.pytchSendKeysToProject("x");

    assertWideInfoWithError(/oh no/);
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

    cy.get(".LayoutChooser .full-screen").click();
    cy.pytchBuild();

    cy.pytchSendKeysToProject("x");

    assertWideInfoWithError(/oh no/);
  });

  it("navigating to project exits full-screen", () => {
    cy.get(".LayoutChooser button.tall-code").click();
    cy.get(".LayoutChooser button.tall-code").should(
      "have.class",
      "btn-primary"
    );
    cy.get(".LayoutChooser button.full-screen").click();
    cy.get(".AssetCardPane").should("not.exist");
    cy.go("back");
    cy.contains("Test seed project").click();
    cy.get(".AssetCardPane");
  });
});
