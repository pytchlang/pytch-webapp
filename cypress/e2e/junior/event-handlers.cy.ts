import {
  assertHatBlockLabels,
  selectActorAspect,
  selectSprite,
  selectStage,
  settleModalDialog,
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
});
