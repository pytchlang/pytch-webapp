import {
  aceControllerMapFromWindow,
  assertHatBlockLabels,
  clickUniqueButton,
  selectActorAspect,
  selectSprite,
  selectStage,
  settleModalDialog,
  soleEventHandlerCodeShouldEqual,
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

  const typeMessageValue = (message: string) =>
    cy.get("li.EventKindOption input").type(`{selectAll}{del}${message}`);

  const addSomeHandlers = () => {
    // Use a mixture of "OK" and double-click.

    addHandler(() => typeMessageValue("award-point"));

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

  const deleteAllCodeOfSoleHandler = () => {
    // Getting focus to the editor seems a bit race-prone.  Try this:
    cy.waitUntil(() => {
      cy.get(".ace_editor").click().type("{selectAll}{del}");
      return cy.window().then((window) => {
        const controllerMap = aceControllerMapFromWindow(window);
        const editorIds = controllerMap.nonSpecialEditorIds();
        if (editorIds.length !== 1) return false;
        const soleCode = controllerMap.get(editorIds[0]).value();
        return soleCode === "";
      });
    });
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

      let eventKindMatches: Array<string> = [
        "when green flag clicked",
        spriteKindSpec.expWhenClickedLabel,
        "when I receive",
        "key pressed",
      ];
      if (spriteKindSpec.label === "sprite") {
        eventKindMatches.push("when I start as a clone");
      }

      cy.get(".modal-footer button").contains("OK").as("ok-btn");

      for (const eventKindMatch of eventKindMatches) {
        cy.get("li.EventKindOption").contains(eventKindMatch).click();
        cy.get("li.EventKindOption.chosen")
          .should("have.length", 1)
          .contains(eventKindMatch);

        cy.get("@ok-btn").should("be.enabled");
      }

      // If we provide a message, that hat-block should become active.
      typeMessageValue("go-for-it");
      cy.get("li.EventKindOption.chosen")
        .should("have.length", 1)
        .contains("when I receive");
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

    // Can't use settleModalDialog(): dismissing the Key Chooser leaves
    // the Hat Block Chooser modal visible, and settleModalDialog()
    // checks that, after performing the action, no modal dialog is
    // visible.
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

    selectSprite("Snake");

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

  it("can drag/drop handler from help", () => {
    const dragHatBlockByIdx = (iHatBlock: number) => {
      cy.get(".pytch-method")
        .eq(iHatBlock)
        .find(".scratch-block-wrapper")
        .drag(".Junior-CodeEditor");
    };
    let expHatBlockLabels: Array<string> = [];
    assertHatBlockLabels(expHatBlockLabels.slice());

    cy.get(".HelpSidebarSection.category-events").click();
    cy.contains("pytch.broadcast");

    dragHatBlockByIdx(2);
    expHatBlockLabels.push("when stage clicked");
    assertHatBlockLabels(expHatBlockLabels.slice());

    cy.pytchSendKeysToApp("# Hello world");
    soleEventHandlerCodeShouldEqual("# Hello world");

    dragHatBlockByIdx(1);
    expHatBlockLabels.push('when "b" key pressed');
    assertHatBlockLabels(expHatBlockLabels.slice());

    dragHatBlockByIdx(0);
    expHatBlockLabels.push("when green flag clicked");
    assertHatBlockLabels(expHatBlockLabels.slice());
  });

  it("ignores INS key in script body editor", () => {
    selectSprite("Snake");
    deleteAllCodeOfSoleHandler();

    cy.get(".ace_editor").type("# 012345{enter}");
    soleEventHandlerCodeShouldEqual("# 012345\n");

    cy.get(".ace_editor").type(
      "{upArrow}{home}{rightArrow}{rightArrow}A" +
        "{insert}{rightArrow}B{insert}{rightArrow}C" +
        "{insert}{rightArrow}D{insert}{rightArrow}E"
    );
    soleEventHandlerCodeShouldEqual("# A0B1C2D3E45\n");
  });

  it("launches autocomplete with electric dot", () => {
    selectSprite("Snake");
    deleteAllCodeOfSoleHandler();

    cy.get(".ace_editor").type("pytch.");
    cy.get(".ace_autocomplete").should("be.visible");
    cy.pytchSendKeysToApp("{downArrow}{downArrow}{downArrow}{enter}");
    soleEventHandlerCodeShouldEqual("pytch.create_clone_of");

    cy.pytchSendKeysToApp("{enter}self.{enter}");
    soleEventHandlerCodeShouldEqual("pytch.create_clone_of\nself.all_clones");

    cy.pytchSendKeysToApp("{enter}rubbish.{enter}");
    soleEventHandlerCodeShouldEqual(
      "pytch.create_clone_of\nself.all_clones\nrubbish.\n"
    );
  });

  it("focuses editor from activity content", () => {
    selectSprite("Snake");
    deleteAllCodeOfSoleHandler();
    cy.pytchSendKeysToApp("# Hello");
    soleEventHandlerCodeShouldEqual("# Hello");

    cy.get(".HelpSidebarSection.category-motion").click();
    cy.contains("turn_degrees");
    cy.pytchSendKeysToApp(" world");
    soleEventHandlerCodeShouldEqual("# Hello world");

    // Switching to a different actor and back again should "forget" the
    // most-recent editor.
    selectStage();
    selectSprite("Snake");

    cy.get(".HelpSidebarSection.category-sensing").click();
    cy.contains("ask_and_wait");
    cy.pytchSendKeysToApp(" again");

    // The " again" should not have been sent to the editor:
    soleEventHandlerCodeShouldEqual("# Hello world");
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

    typeMessageValue("go\\for'it");
    settleModalDialog("OK");

    assertHatBlockLabels([
      "when green flag clicked",
      'when I receive "goforit"',
    ]);
  });

  it("helps user re non-empty message", () => {
    const doubleClickWhenIReceive = () =>
      cy
        .get(".EventKindOption")
        .contains("receive")
        .click("left")
        .dblclick("left");

    launchAddHandler();
    doubleClickWhenIReceive();

    assertHatBlockLabels([
      "when green flag clicked",
      'when I receive "message-1"',
    ]);

    launchAddHandler();
    cy.get(".EventKindOption").contains("receive").click("left");
    cy.get('input[type="text"]').click().type("{selectAll}{del}");
    doubleClickWhenIReceive();
    cy.get(".empty-message-hint").should("be.visible");
    cy.get('input[type="text"]').click().type("h");
    cy.get(".empty-message-hint").should("not.be.visible");
    cy.get('input[type="text"]').type("ello-world");
    settleModalDialog("OK");

    assertHatBlockLabels([
      "when green flag clicked",
      'when I receive "message-1"',
      'when I receive "hello-world"',
    ]);
  });

  it("can change hatblock with double-click", () => {
    addHandler(() => typeMessageValue("go for it"));
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
      addHandler(() => typeMessageValue("go for it"));
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
