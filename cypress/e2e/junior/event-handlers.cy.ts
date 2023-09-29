import {
  selectActorAspect,
  selectSprite,
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
});
