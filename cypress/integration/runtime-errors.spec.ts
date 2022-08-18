/// <reference types="cypress" />

context("Runtime errors", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("reports error if render fails", () => {
    // This is mildly fiddly to arrange.  We want an error to be
    // raised when accessing information needed during render, but
    // only after the "x" key has been pressed.
    cy.pytchBuildCode(`
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

    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("x");
    cy.pytchShouldShowErrorCard("oh no", "user-space");
  });

  it("reports error if event handler fails", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = [("rect", "red-rectangle-80-60.png", 0, 0)]

        @pytch.when_key_pressed("x")
        def cause_trouble(self):
          self.no_such_method()
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("x");
    cy.pytchShouldShowErrorContext("has stopped");
    cy.pytchShouldShowErrorCard(/no attribute.*no_such_method/, "user-space");
  });

  it("reports error with deeper stack trace", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = []

        @pytch.when_key_pressed("x")
        def cause_trouble(self):
          self.cause_more_trouble()

        def cause_more_trouble(self):
          self.cause_lots_more_trouble()

        def cause_lots_more_trouble(self):
          self.actually_cause_trouble()

        def actually_cause_trouble(self):
          print(1 / 0)
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("x");
    cy.pytchShouldShowErrorContext("has stopped");
    cy.pytchShouldShowErrorCard("division by zero", "user-space");
    cy.pytchShouldHaveErrorStackTraceOfLength(4);
  });

  it("reports multiple simultaneous errors", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = []
        @pytch.when_key_pressed("x")
        def banana_trouble(self):
          self.no_such_method()

      class Cherry(pytch.Sprite):
        Costumes = []
        @pytch.when_key_pressed("x")
        def cherry_trouble(self):
          print(1 / 0)
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.pytchSendKeysToProject("x");
    cy.pytchShouldShowErrorContext("has stopped");
    cy.get(".ErrorReportAlert").should("have.length", 2);
    cy.pytchShouldShowErrorCard(
      /Banana.*banana_trouble.*keypress "x".*AttributeError.*no_such_method/,
      "user-space"
    );
    cy.pytchShouldShowErrorCard(
      /Cherry.*cherry_trouble.*keypress "x".*ZeroDivisionError/,
      "user-space"
    );
  });

  it("handles 'internal' errors", () => {
    cy.pytchBuildCode(`
      import pytch
      import time

      class Banana(pytch.Sprite):
        Costumes = []
        @pytch.when_key_pressed("x")
        def banana_trouble(self):
          time.sleep(1.0)
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();

    cy.pytchSendKeysToProject("x");
    cy.pytchShouldShowErrorContext("has stopped");
    cy.pytchShouldShowErrorCard(
      new RegExp('Banana.*banana_trouble.*keypress "x".*non-Pytch suspension'),
      "internal"
    );
  });
});
