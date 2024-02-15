import { selectActorAspect, selectSprite } from "./utils";

context("Use Python stdlib modules", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const setScriptCode = (codeText: string) => {
    selectSprite("Snake");
    selectActorAspect("Code");
    cy.get(".PytchScriptEditor .ace_editor").type(
      `{selectAll}{del}${codeText}`
    );
  };
});
