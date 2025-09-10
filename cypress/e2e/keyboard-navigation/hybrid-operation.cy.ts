import { selectSprite, settleModalDialog } from "../junior/utils";
import { assertFocus, summonCcMenuByKbd } from "./utils";

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
});
