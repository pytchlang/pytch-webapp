import {
  launchAdd,
  ScriptOps,
  selectActorAspect,
  selectSprite,
  settleModalDialog,
} from "../junior/utils";
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

  it("summon with kbd, launch different actor ccmenu with mouse", () => {
    selectSprite("Snake");
    summonCcMenuByKbd();
    assertFocus("actor-card-menu-item", [1, 0]);

    // Click on Stage's dropdown toggle.
    cy.get(".Item-ActorCard:first-child .dropdown").click();

    // Stage's dropdown should appear and Sprite's dropdown should disappear.
    cy.get(".Item-ActorCard:first-child .show.dropdown").should("be.visible");
    cy.get(".Item-ActorCard:last-child .show.dropdown").should("not.exist");
  });

  it("summon with kbd, launch script ccmenu with mouse", () => {
    selectSprite("Snake");
    selectActorAspect("Code");
    realPress("Tab");
    assertFocus("script", 0);

    selectSprite("Snake");
    summonCcMenuByKbd();

    ScriptOps.launchHandlerDropdown(0);
    cy.get(".Junior-ScriptItem .show.dropdown").should("have.length", 1);
    cy.get(".Item-ActorCard .show.dropdown").should("not.exist");
  });
});
