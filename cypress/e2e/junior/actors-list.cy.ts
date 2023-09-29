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
});
