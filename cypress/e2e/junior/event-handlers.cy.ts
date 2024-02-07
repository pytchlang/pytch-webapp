import {
  assertHatBlockLabels,
  clickUniqueButton,
  selectActorAspect,
  selectSprite,
  selectStage,
  settleModalDialog,
  typeIntoScriptEditor,
} from "./utils";
import { saveButton } from "../utils";

context("Create/modify/delete event handlers", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const launchAddHandler = () => {
    selectSprite("Snake");
    selectActorAspect("Code");
    cy.get(".Junior-CodeEditor .AddSomethingButton").click();
  };

  const addHandler = (
    activateDesiredKindFun: () => void,
    doSubmitFun?: () => void
  ) => {
    launchAddHandler();
    activateDesiredKindFun();
    if (doSubmitFun != null) {
      doSubmitFun();
    } else {
      settleModalDialog("OK");
    }
  };

  const addSomeHandlers = () => {
    // Use a mixture of "OK" and double-click.

    addHandler(() => cy.get("li.EventKindOption input").type("award-point"));

    // Using as() like this relies on addHandler() calling the
    // "activate" and "submit" functions in that order.
    addHandler(
      () =>
        cy.get("li.EventKindOption").contains("clone").as("clone-hat").click(),
      () => cy.get("@clone-hat").dblclick()
    );

    addHandler(() =>
      cy.get("li.EventKindOption").contains("this sprite").click()
    );
  };

  const allExtendedHandlerLabels = [
    "when green flag clicked",
    'when I receive "award-point"',
    "when I start as a clone",
    "when this sprite clicked",
  ];

  const someExtendedHandlerLabels = (idxs: Array<number>) =>
    idxs.map((i) => allExtendedHandlerLabels[i]);

  const chooseHandlerDropdownItem = (
    scriptIndex: number,
    itemMatch: string
  ) => {
    cy.get(".PytchScriptEditor .HatBlock")
      .eq(scriptIndex)
      .find("button.dropdown-toggle")
      .click();
    cy.get(".dropdown-item").contains(itemMatch).click();
  };

  it("shows help when no handlers", () => {
    selectStage();
    selectActorAspect("Code");
    cy.get(".NoContentHelp").contains("Your stage has no scripts");
  });

  it("can cancel adding event handler", () => {
    const assertHandlersUnchanged = () =>
      assertHatBlockLabels(["when green flag clicked"]);

    launchAddHandler();
    cy.assertCausesToVanish(".UpsertHandlerModal", () =>
      cy.get(".UpsertHandlerModal").type("{esc}")
    );
    assertHandlersUnchanged();

    launchAddHandler();
    cy.assertCausesToVanish(".UpsertHandlerModal", () =>
      cy.get(".UpsertHandlerModal .btn-close").click()
    );
    assertHandlersUnchanged();

    launchAddHandler();
    settleModalDialog("Cancel");
    assertHandlersUnchanged();
  });

  const addEventHandlerSpecs = [
    {
      label: "stage",
      selectAction: selectStage,
      expWhenClickedLabel: "when stage clicked",
    },
    {
      label: "sprite",
      selectAction: () => selectSprite("Snake"),
      expWhenClickedLabel: "when this sprite clicked",
    },
  ];
  addEventHandlerSpecs.forEach((spriteKindSpec) =>
    it(`can choose which event handler to add (${spriteKindSpec.label})`, () => {
      spriteKindSpec.selectAction();
      selectActorAspect("Code");
      cy.get(".Junior-CodeEditor .AddSomethingButton").click();

      // We have not yet typed a message for "when I receive", so choosing
      // that hat block should leave "OK" disabled.  All others are
      // immediately OK.
      type ActionSpec = { match: string; expOkEnabled?: boolean };
      const specs: Array<ActionSpec> = [
        { match: "when green flag clicked" },
        { match: "when I start as a clone" },
        { match: spriteKindSpec.expWhenClickedLabel },
        { match: "when I receive", expOkEnabled: false },
        { match: "key pressed" },
      ];

      cy.get(".modal-footer button").contains("OK").as("ok-btn");

      for (const spec of specs) {
        cy.get("li.EventKindOption").contains(spec.match).click();
        cy.get("li.EventKindOption.chosen")
          .should("have.length", 1)
          .contains(spec.match);

        const expOkEnabled = spec.expOkEnabled ?? true;
        const predicate = expOkEnabled ? "be.enabled" : "be.disabled";
        cy.get("@ok-btn").should(predicate);
      }

      // If we provide a message, that should become active, and OK should
      // be enabled.
      cy.get("li.EventKindOption input").type("go-for-it");
      cy.get("li.EventKindOption.chosen")
        .should("have.length", 1)
        .contains("when I receive");
      cy.get("@ok-btn").should("be.enabled");
    })
  );

  it("can choose key for when-key-pressed", () => {
    const launchKeyChooser = () =>
      cy.get("li.EventKindOption .KeyEditor").click();

    const assertKeySelected = (match: string) =>
      cy
        .get(".KeyChoiceModal .KeyOption.isSelected")
        .should("have.length", 1)
        .contains(match);

    launchAddHandler();
    launchKeyChooser();
    assertKeySelected("space");

    cy.get(".KeyOption").contains("f").click();
    assertKeySelected("f");

    // Can't use settleModalDialog() because dismissing the Key Chooser
    // leaves the Hat Block Chooser modal visible, and
    // settleModalDialog() checks that, after performing the action, no
    // modal dialog is visible.
    clickUniqueButton("OK");

    cy.get(".KeyEditor .key-display-name").should("have.text", "f");

    launchKeyChooser();
    assertKeySelected("f");

    cy.get(".KeyOption").contains("x").click();
    assertKeySelected("x");

    // As above, close key chooser:
    clickUniqueButton("OK");
    // and then close hat-block chooser:
    settleModalDialog("OK");

    assertHatBlockLabels(["when green flag clicked", 'when "x" key pressed']);

    typeIntoScriptEditor(1, 'print("got x"){enter}');

    cy.pytchGreenFlag();
    cy.pytchSendKeysToApp("xx");
    cy.pytchStdoutShouldEqual("got x\ngot x\n");
  });

  it("can add and delete handlers", () => {
    const launchDeleteHandlerByIndex = (idx: number) => {
      chooseHandlerDropdownItem(idx, "DELETE");
      cy.get(".modal-header").contains("Delete script?");
    };

    saveButton.shouldReactToInteraction(() => {
      addSomeHandlers();
    });
    assertHatBlockLabels(allExtendedHandlerLabels);

    launchDeleteHandlerByIndex(2);
    settleModalDialog("Cancel");
    assertHatBlockLabels(allExtendedHandlerLabels);
    saveButton.shouldShowNoUnsavedChanges();

    saveButton.shouldReactToInteraction(() => {
      launchDeleteHandlerByIndex(2);
      settleModalDialog("DELETE");
    });
    assertHatBlockLabels(someExtendedHandlerLabels([0, 1, 3]));

    saveButton.shouldReactToInteraction(() => {
      launchDeleteHandlerByIndex(2);
      settleModalDialog("DELETE");
    });
    assertHatBlockLabels(someExtendedHandlerLabels([0, 1]));

    saveButton.shouldReactToInteraction(() => {
      launchDeleteHandlerByIndex(0);
      settleModalDialog("DELETE");
    });
    assertHatBlockLabels(someExtendedHandlerLabels([1]));

    saveButton.shouldReactToInteraction(() => {
      launchDeleteHandlerByIndex(0);
      settleModalDialog("DELETE");
    });
    assertHatBlockLabels([]);
  });

  it("drag-and-drop event handlers", () => {
    addSomeHandlers();
    assertHatBlockLabels(allExtendedHandlerLabels);
    saveButton.click();

    cy.get(".Junior-ScriptsEditor").as("editor");
    cy.get("@editor").contains("when green flag clicked").as("flag-clicked");
    cy.get("@editor").contains("when I receive").as("msg-rcvd");
    cy.get("@editor").contains("when I start as a clone").as("clone");
    cy.get("@editor").contains("when this sprite clicked").as("sprite-clicked");

    saveButton.shouldReactToInteraction(() => {
      cy.get("@sprite-clicked").drag("@clone");
    });
    assertHatBlockLabels(someExtendedHandlerLabels([0, 1, 3, 2]));

    saveButton.shouldReactToInteraction(() => {
      cy.get("@sprite-clicked").drag("@flag-clicked");
    });
    assertHatBlockLabels(someExtendedHandlerLabels([3, 0, 1, 2]));

    saveButton.shouldReactToInteraction(() => {
      cy.get("@msg-rcvd").drag("@flag-clicked");
    });
    assertHatBlockLabels(someExtendedHandlerLabels([3, 1, 0, 2]));
  });

  it("can reorder event handlers with buttons", () => {
    const moveHandlerAndAssertLabels = (
      movingIdx: number,
      direction: "prev" | "next",
      expOrderAfterMove: Array<number>
    ) => {
      cy.get(".Junior-ScriptsEditor .HatBlock")
        .eq(movingIdx)
        .find(`button.swap-${direction}`)
        .click({ force: true });
      assertHatBlockLabels(someExtendedHandlerLabels(expOrderAfterMove));
    };

    saveButton.shouldReactToInteraction(() => {
      addSomeHandlers();
    });
    saveButton.shouldReactToInteraction(() => {
      moveHandlerAndAssertLabels(1, "prev", [1, 0, 2, 3]);
    });

    saveButton.shouldReactToInteraction(() => {
      moveHandlerAndAssertLabels(1, "next", [1, 2, 0, 3]);
      moveHandlerAndAssertLabels(0, "next", [2, 1, 0, 3]);
    });

    saveButton.shouldReactToInteraction(() => {
      moveHandlerAndAssertLabels(2, "next", [2, 1, 3, 0]);
    });
  });

  it("restricts characters for when-receive", () => {
    launchAddHandler();

    cy.get("li.EventKindOption input").type("go\\for'it");
    settleModalDialog("OK");

    assertHatBlockLabels([
      "when green flag clicked",
      'when I receive "goforit"',
    ]);
  });

  it("can change hatblock with double-click", () => {
    addHandler(() => cy.get("li.EventKindOption input").type("go for it"));
    saveButton.click();

    saveButton.shouldReactToInteraction(() => {
      cy.get(".HatBlock").contains('"go for it"').dblclick();
      cy.contains("when I start as a clone").click();
      settleModalDialog("OK");
    });

    assertHatBlockLabels([
      "when green flag clicked", // From sample
      "when I start as a clone",
    ]);
  });

  it("can change hatblock with dropdown item", () => {
    saveButton.shouldReactToInteraction(() => {
      addHandler(() => cy.get("li.EventKindOption input").type("go for it"));
    });

    saveButton.shouldReactToInteraction(() => {
      chooseHandlerDropdownItem(1, "Change hat block");

      cy.get("li.EventKindOption.chosen")
        .should("have.length", 1)
        .find("input")
        .should("have.value", "go for it");

      cy.get(".EventKindOption").contains("when this").click();
      settleModalDialog("OK");
    });

    assertHatBlockLabels([
      "when green flag clicked", // From sample
      "when this sprite clicked",
    ]);
  });

  it("can edit code, updating Save button", () => {
    selectStage();
    addSomeHandlers();
    cy.get(".ace_editor").as("editors").should("have.length", 4);
    saveButton.click();

    saveButton.shouldReactToInteraction(() => {
      cy.get("@editors").eq(1).type("# Hello world testing");
    });
  });
});
