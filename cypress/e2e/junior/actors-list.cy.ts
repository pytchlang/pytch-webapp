import {
  assertActorNames,
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
});
