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

  it("can use math module", () => {
    setScriptCode("print(math.gcd(30, 45))");
    cy.pytchGreenFlag();
    cy.pytchStdoutShouldEqual("15\n");
  });
});
