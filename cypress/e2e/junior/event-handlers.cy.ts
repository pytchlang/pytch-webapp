import {
  assertHatBlockLabels,
  clickUniqueButton,
  selectActorAspect,
  selectSprite,
  selectStage,
  settleModalDialog,
  typeIntoScriptEditor,
} from "./utils";

context("Create/modify/delete event handlers", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const launchAddHandler = () => {
    selectSprite("Snake");
    selectActorAspect("Code");
    cy.get(".Junior-ScriptsEditor .AddSomethingButton").click();
  };

  const addHandler = (addFun: () => void) => {
    launchAddHandler();
    addFun();
    settleModalDialog("OK");
  };

  const chooseHandlerDropdownItem = (
    scriptIndex: number,
    itemMatch: string
  ) => {
    cy.get(".PytchScriptEditor .HatBlock")
      .eq(scriptIndex)
      .find("button")
      .click();
    cy.get(".dropdown-item").contains(itemMatch).click();
  };

  const noOperation = () => void 0;

  it("shows help when no handlers", () => {
    selectStage();
    selectActorAspect("Code");
    cy.get(".NoContentHelp").contains("Your stage has no scripts");
  });

  it("can cancel adding Sprite handler", () => {
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

  it("can choose which event handler to add", () => {
    launchAddHandler();

    // We have not yet typed a message for "when I receive", so choosing
    // that hat block should leave "OK" disabled.  All others are
    // immediately OK.
    type ActionSpec = { match: string; expOkEnabled?: boolean };
    const specs: Array<ActionSpec> = [
      { match: "when green flag clicked" },
      { match: "when I start as a clone" },
      { match: "when this sprite/stage clicked" }, // TODO: Fix text
      { match: "when I receive", expOkEnabled: false },
      { match: "when key" },
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
  });

  it("can choose key for when-key-pressed", () => {
    const launchKeyChooser = () =>
      cy
        .get("li.EventKindOption .KeyEditor .edit-button")
        // The button only appears on hover, so we need to force Cypress:
        .click({ force: true });

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

    cy.get(".KeyEditor .key-button").should("have.text", "f");

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

    const allHandlers = [
      "when green flag clicked",
      'when I receive "award-point"',
      "when I start as a clone",
      "when green flag clicked",
    ];

    const someHandlers = (idxs: Array<number>) =>
      idxs.map((i) => allHandlers[i]);

    addHandler(() => cy.get("li.EventKindOption input").type("award-point"));
    addHandler(() => cy.get("li.EventKindOption").contains("clone").click());
    addHandler(noOperation);

    assertHatBlockLabels(allHandlers);

    launchDeleteHandlerByIndex(2);
    settleModalDialog("Cancel");
    assertHatBlockLabels(allHandlers);

    launchDeleteHandlerByIndex(2);
    settleModalDialog("DELETE");
    assertHatBlockLabels(someHandlers([0, 1, 3]));

    launchDeleteHandlerByIndex(2);
    settleModalDialog("DELETE");
    assertHatBlockLabels(someHandlers([0, 1]));

    launchDeleteHandlerByIndex(0);
    settleModalDialog("DELETE");
    assertHatBlockLabels(someHandlers([1]));

    launchDeleteHandlerByIndex(0);
    settleModalDialog("DELETE");
    assertHatBlockLabels([]);
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

    cy.get(".HatBlock").contains('"go for it"').dblclick();
    cy.contains("when I start as a clone").click();
    settleModalDialog("OK");

    assertHatBlockLabels([
      "when green flag clicked", // From sample
      "when I start as a clone",
    ]);
  });
});
