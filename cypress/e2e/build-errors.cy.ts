/// <reference types="cypress" />

context("Build errors", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("reports multiple syntax errors", () => {
    cy.pytchBuildCode(`
      import pytch
      )
      print("hello world"]
      print("hello again
    `);

    cy.pytchShouldShowErrorContext("could not be started");

    cy.get(".ErrorReportAlert").as("errors").should("have.length", 4);

    cy.get("@errors").eq(0).contains("extra symbol ')'");
    cy.get("@errors").eq(0).contains("Line 2 (position 0)");

    cy.get("@errors").eq(1).contains("mismatched brackets");
    cy.get("@errors").eq(1).contains("Line 3 (position 19)");

    cy.get("@errors").eq(2).contains("unterminated");
    cy.get("@errors").eq(2).contains("Line 4 (position 6)");

    cy.get("@errors").eq(3).contains("parenthesis missing");
    cy.get("@errors").eq(3).contains("Line 4 (position 18)");

    // Verify that button warps cursor to correct location.
    cy.get("span.go-to-line").contains("Line 3 (position 19)").click();
    cy.pytchSendKeysToApp("NEWTEXT");
    cy.pytchCodeTextShouldContain('world"NEWTEXT]');
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
    cy.get(".stack-trace-frame-summary").as("errors").should("have.length", 4);

    // First one has capital "Line"; others lower-case "line".
    cy.get("@errors").eq(0).contains("Line 8 (position 0)");
    cy.get("@errors").eq(1).contains("line 7 (position 2)");
    cy.get("@errors").eq(2).contains("line 5 (position 2)");
    cy.get("@errors").eq(3).contains("line 3 (position 2)");
  });
});
