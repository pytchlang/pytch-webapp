import { launchAdd, selectSprite, settleModalDialog } from "../junior/utils";
import { assertFocus, realPress, summonCcMenuByKbd } from "./utils";

context("Hybrid kbd/mouse operation", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  it("summon with kbd, operate with mouse", () => {
    selectSprite("Snake");
    summonCcMenuByKbd();

    cy.get(".ActorCard .show.dropdown a.dropdown-item")
      .contains("DELETE")
      .click();

    settleModalDialog("Cancel");
    assertFocus("actor-card", 1);
  });

  it("summon with kbd, launch different operation with mouse", () => {
    selectSprite("Snake");
    summonCcMenuByKbd();

    cy.get(".ActorCard a.dropdown-item").should("have.length", 5);
    realPress("ArrowDown", 2);
    assertFocus("actor-card-menu-item", [1, 2]);

    launchAdd.script();
    cy.get(".show.dropdown").should("not.exist");
    settleModalDialog("Cancel");
    assertFocus("script", 0);
  });
});
