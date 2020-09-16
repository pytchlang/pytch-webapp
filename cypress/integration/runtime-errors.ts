/// <reference types="cypress" />

context("Runtime errors", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("reports error if render fails", () => {
    // This is mildly fiddly to arrange, but we want an error to be
    // raised when accessing information needed during render.
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = [("rect", "red-rectangle-80-60.png", 0, 0)]

        @property
        def _x(self):
          raise RuntimeError("oh no")

        @_x.setter
        def _x(self, x):
          pass

        @pytch.when_green_flag_clicked
        def cause_trouble(self):
          self.go_to_xy(0, 0)
          self.show()
      `);

    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchGreenFlag();
    cy.pytchShouldShowErrorCard("oh no");
  });
});
