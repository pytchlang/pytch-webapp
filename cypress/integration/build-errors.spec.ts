/// <reference types="cypress" />

context("Build errors", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("gives build error if typo", () => {
    cy.pytchBuildCode(`
      import pytch
      pront("oh no!")
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard("NameError", "user-space");
  });

  it("gives build error if bad costume", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = [('yellow', 'no-such-file.png', 10, 10)]
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard(
      /PytchAssetLoadError.*Image "no-such-file.png"/,
      "user-space"
    );
  });

  it("gives build error if bad sound", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
          Costumes = []
          Sounds = [('splat', 'no-such-file.mp3')]
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard(
      /PytchAssetLoadError.*Sound "no-such-file.mp3"/,
      "user-space"
    );
  });

  it("gives import error without import pytch", () => {
    cy.pytchBuildCode(`
      print("hello world")
    `);

    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard(/ImportError.*import pytch/, "user-space");
  });

  it("gives full traceback", () => {
    cy.pytchBuildCode(`
      import pytch
      def oh_no_0():
        print(1 / 0)
      def oh_no_1():
        oh_no_0()
      def oh_no_2():
        oh_no_1()
      oh_no_2()
    `);
    cy.pytchShouldShowErrorContext("could not be started");
    cy.pytchShouldShowErrorCard(/ZeroDivisionError/, "user-space");

    // top-level oh_no_2() call
    // -> call to oh_no_1() from inside oh_no_2()
    // -> call to oh_no_0() from inside oh_no_1()
    // -> division by zero inside oh_no_0()
    cy.get(".stack-trace-frame-summary").should("have.length", 4);
  });
});
