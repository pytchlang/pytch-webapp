import {
  assertActorNames,
  assertBackdropNames,
  assertCostumeNames,
  elementIsVisible,
  selectActorAspect,
  settleModalDialog,
} from "./utils";

context("Work with list of actors", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const launchAddSprite = () =>
    cy.get(".Junior-ActorsList-container .AddSomethingButton").click();

  it("can add sprites", () => {
    assertActorNames(["Stage", "Snake"]);

    launchAddSprite();
    settleModalDialog("OK");
    assertActorNames(["Stage", "Snake", "Sprite1"]);

    launchAddSprite();
    cy.get(".modal-dialog input").type("{selectAll}{del}Banana");
    settleModalDialog("OK");
    assertActorNames(["Stage", "Snake", "Sprite1", "Banana"]);
  });

  it("focuses actor by clicking", () => {
    const assertFocusFollowsClick = (targetIdx: number) => {
      // The card should be focused.
      cy.get(".ActorCard")
        .eq(targetIdx)
        .click()
        .should("have.class", "isFocused");

      // And only that card should have a visible dropdown.
      cy.get(".ActorCard .dropdown").then(($divs) => {
        const divs = $divs.toArray();
        const gotVisibilities = divs.map(elementIsVisible);
        const expVisibilities = divs.map((_d, i) => i === targetIdx);
        expect(gotVisibilities).deep.eq(expVisibilities);
      });

      // Hard-code expected costumes for each index.
      switch (targetIdx) {
        case 0:
          assertBackdropNames(["solid-white.png"]);
          break;
        case 1:
          assertCostumeNames(["python-logo.png"]);
          break;
        default:
          assertCostumeNames([]);
      }
    };

    selectActorAspect("Backdrops");

    launchAddSprite();
    settleModalDialog("OK");
    launchAddSprite();
    settleModalDialog("OK");
    assertActorNames(["Stage", "Snake", "Sprite1", "Sprite2"]);

    [0, 2, 3, 1, 2, 1, 0].forEach(assertFocusFollowsClick);
  });

  it("can't rename or delete Stage", () => {
    cy.get(".ActorCard").eq(0).click().find("button").click();
    cy.get(".dropdown-item")
      .contains("DELETE")
      .should("have.class", "disabled");
    cy.get(".dropdown-item")
      .contains("Rename")
      .should("have.class", "disabled");
  });

  const launchRenameActorByIndex = (idx: number) => {
    cy.get(".ActorCard").eq(idx).click().find("button").click();
    cy.get(".dropdown-item").contains("Rename").click();
    cy.get(".modal-header").contains("Rename");
  };

  const launchDeleteActorByIndex = (idx: number) => {
    cy.get(".ActorCard").eq(idx).click().find("button").click();
    cy.get(".dropdown-item.disabled").should("not.exist");
    cy.get(".dropdown-item").contains("DELETE").click();
    cy.get(".modal-header").contains("Delete");
  };

  [
    { actionName: "rename", launchFun: launchRenameActorByIndex },
    { actionName: "delete", launchFun: launchDeleteActorByIndex },
  ].forEach((spec) =>
    it(`can cancel ${spec.actionName} of Sprite`, () => {
      launchAddSprite();
      settleModalDialog("OK");

      const assertUnchanged = () =>
        assertActorNames(["Stage", "Snake", "Sprite1"]);

      spec.launchFun(1);
      settleModalDialog("Cancel");
      assertUnchanged();

      spec.launchFun(1);
      settleModalDialog(() => cy.get(".modal-header .btn-close").click());
      assertUnchanged();

      spec.launchFun(1);
      settleModalDialog(() => cy.get(".modal-body").type("{esc}"));
      assertUnchanged();
    })
  );

  it("can rename a sprite", () => {
    launchAddSprite();
    settleModalDialog("OK");

    const inputNewName = (name: string) =>
      cy.get(".modal-dialog input").type(`{selectAll}{del}${name}`);

    const assertOkButtonIs = (predicateNub: "disabled" | "enabled") =>
      cy
        .get(".modal-dialog button")
        .contains("OK")
        .should(`be.${predicateNub}`);

    const assertForbiddenBecause = (match: string) => {
      assertOkButtonIs("disabled");
      cy.get(".modal-dialog .validity-assessment.invalid").contains(match);
    };

    launchRenameActorByIndex(1);
    assertOkButtonIs("disabled");

    inputNewName("Python");
    assertOkButtonIs("enabled");

    inputNewName("Sprite1");
    assertForbiddenBecause("already a Sprite");

    inputNewName("Stage");
    assertForbiddenBecause('a Sprite called "Stage"');

    inputNewName("hello-world");
    assertForbiddenBecause("it does not follow the rules");

    inputNewName("Python");
    assertOkButtonIs("enabled");
    settleModalDialog("OK");

    assertActorNames(["Stage", "Python", "Sprite1"]);
  });

  const assertActorFocusedByIndex = (idx: number) => {
    cy.get(".ActorCard.isFocused").should("have.length", 1);
    cy.get(".ActorCard").eq(idx).should("have.class", "isFocused");
  };

  const assertModalHeaderText = (match: string) => {
    cy.get(".modal-header").should("have.text", match);
  };
});
