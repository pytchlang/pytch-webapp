/// <reference types="cypress" />

import { saveButton } from "./utils";
import { stageHeight } from "../../src/constants";

context("Interact with code editor", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  beforeEach(() => cy.pytchBuildCode("\nimport pytch\n"));

  it("auto-completes top-level pytch attributes", () => {
    cy.get("#pytch-ace-editor").type("pytch.st_and_wa{ctrl} ");

    // This feels quite fragile but is working for now:
    cy.get(".ace_autocomplete").click();

    cy.pytchCodeTextShouldContain("pytch.broadcast_and_wait");
  });

  it("auto-completes Actor methods", () => {
    cy.get("#pytch-ace-editor").type("self.sound_until{ctrl} ");
    cy.get(".ace_autocomplete").click();
    cy.pytchCodeTextShouldContain("self.play_sound_until_done");
  });

  it("keeps code content when changing layout", () => {
    cy.get("#pytch-ace-editor").type("# HELLO WORLD{enter}");
    cy.get(".layout-icon.tall-code").click();
    cy.get("button.tall-code.btn-primary");
    cy.pytchCodeTextShouldContain("HELLO WORLD");
    cy.get(".layout-icon.wide-info").click();
    cy.get("button.wide-info.btn-primary");
    cy.pytchCodeTextShouldContain("HELLO WORLD");
  });

  it("indicates when unsaved changes exist", () => {
    saveButton.shouldReactToInteraction(() => {
      cy.get("#pytch-ace-editor").type("# HELLO{enter}");
    });
    saveButton.shouldReactToInteraction(() => {
      cy.get("#pytch-ace-editor").type("# WORLD{enter}");
    });

    // This change will get lost; would be good to improve this part of
    // the user experience.
    cy.get("#pytch-ace-editor").type("# (again){enter}");
    saveButton.shouldShowUnsavedChanges();

    cy.pytchSwitchProject("Test seed");
    saveButton.shouldShowNoUnsavedChanges();
  });

  it("allows searching for text", () => {
    cy.get("#pytch-ace-editor")
      .type("\n# A needle in a haystack\n")
      .type("{ctrl}f");
    cy.get(".ace_search");
    cy.pytchSendKeysToApp("needle");
    cy.get(".ace_search").contains("1 of 1");
    cy.pytchSendKeysToApp("{esc}");
    cy.get(".ace_selected-word");
  });

  it("allows search/replace operation", () => {
    cy.get("#pytch-ace-editor")
      .type("\n# A needle in a haystack\n")
      .type("{ctrl}h");
    cy.get(".ace_search");
    cy.pytchSendKeysToApp("needle");
    cy.get(".ace_replace_form .ace_search_field").focus();
    cy.pytchSendKeysToApp("banana{enter}{esc}");
    cy.get("#pytch-ace-editor").contains("banana in a haystack");
  });

  it("ignores INS key", () => {
    // Do the final typing as one call to type(); multiple chained calls
    // seem to reset the insertion point in the Ace editor.
    cy.get("#pytch-ace-editor")
      .type("{end}")
      .type("# 012345{enter}")
      .type(
        "{upArrow}{home}{rightArrow}{rightArrow}A" +
          "{insert}{rightArrow}B{insert}{rightArrow}C" +
          "{insert}{rightArrow}D{insert}{rightArrow}E"
      );
    cy.pytchCodeTextShouldEqual("import pytch\n# A0B1C2D3E45\n");
  });

  [
    {
      label: "C-return",
      keyChord: "{control}{enter}",
      expectedFocus: "stage",
    },
    /* Tried but could not get this to work under recent Ace:
    {
      label: "C-S-return",
      keyChord: "{control}{shift}{enter}",
      expectedFocus: "editor",
    },
    */
  ].forEach((spec) =>
    it(`can build project from editor keypress (${spec.label})`, () => {
      cy.pytchBuildCode(`
        import pytch

        class Beacon(pytch.Sprite):
          Costumes = []
          @pytch.when_key_pressed("x")
          def say_hello(self):
            print("hello")
      `);

      cy.pytchFocusEditor();
      cy.focused()
        .as("focusBeforeKbdCommand", { type: "static" })
        .type(spec.keyChord);

      cy.pytchStdoutShouldEqual("");

      switch (spec.expectedFocus) {
        case "stage":
          cy.get("@focusBeforeKbdCommand").should("not.be.focused");
          cy.focused().type("x");
          cy.pytchStdoutShouldEqual("hello\n");
          break;
        case "editor":
          cy.get("@focusBeforeKbdCommand").should("be.focused");
          cy.focused().type("# Add this before code: x x\n\n");
          cy.pytchCodeTextShouldContain("Add this");
          cy.pytchStdoutShouldEqual("");
          break;
      }
    })
  );
});

context("Undo history", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
    cy.pytchFocusEditor();
  });

  it("allows undo after initial load", () => {
    cy.pytchSendKeysToApp("{end}");
    cy.pytchSendKeysToApp("hello");
    cy.pytchCodeTextShouldEqual("import pytch\n\nhello");
    cy.pytchSendKeysToApp("{ctrl}z");
    cy.pytchCodeTextShouldEqual("import pytch\n\n");
  });

  it("starts empty when project loads", () => {
    cy.pytchSendKeysToApp("{ctrl}z");
    cy.pytchSendKeysToApp("{end}");
    cy.pytchSendKeysToApp("# HELLO");
    cy.pytchCodeTextShouldEqual("import pytch\n\n# HELLO");
  });
});

context("Drag vertical resizer", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
  });

  [
    { resizeDelta: 50, expectedEffectiveDelta: 50 },
    { resizeDelta: -50, expectedEffectiveDelta: -50 },
    // The following two have to match the clamping performed in
    // VerticalResizer.onTouchMove().
    { resizeDelta: -200, expectedEffectiveDelta: -stageHeight / 2 },
    { resizeDelta: +200, expectedEffectiveDelta: stageHeight / 4 },
  ].forEach((spec) =>
    it(`can drag vertical UI divider by ${spec.resizeDelta}`, () => {
      cy.pytchDragStageDivider(spec.resizeDelta);

      cy.get("#pytch-canvas")
        .invoke("height")
        .should("eq", stageHeight + spec.expectedEffectiveDelta);
    })
  );
});

context("Tall-code-editor has full-width info pane", () => {
  it("displays info pane across right-hand half", () => {
    cy.pytchExactlyOneProject();

    cy.pytchBuildCode(`
      import pytch
      print("X")
    `);

    cy.pytchDragStageDivider(500);
    cy.get(".layout-icon.tall-code").click();
    cy.get("button.tall-code.btn-primary");
    cy.get(".InfoPanel").within(() => {
      // Show the "Output" tab, which has naturally-narrow content,
      // being just the "X" which was printed at build time.
      cy.contains("Output").click();
    });

    // This is pretty fragile.  The threshold will need changing if the
    // Cypress viewport setting is changed, and probably for other
    // reasons too.  Try it like this, and see if it becomes annoying.
    cy.get(".tab-content").invoke("width").should("be.gt", 550);
  });
});
