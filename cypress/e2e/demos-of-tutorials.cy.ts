import { kExpNTutorials } from "./utils";

context("Demos of all tutorials", () => {
  function assertNTutorials() {
    cy.get("ul.tutorial-list li").should("have.length", kExpNTutorials);
  }

  function launchNthTutorialDemo(tutorialIndex: number) {
    const childNumber = tutorialIndex + 1;
    cy.get(
      `ul.tutorial-list li:nth-child(${childNumber})` +
        ' button[title="Try this project"]'
    ).click();
  }

  it("can run demos", () => {
    cy.pytchResetDatabase({ initialUrl: "/tutorials/" });
    assertNTutorials();

    for (let tutIdx = 0; tutIdx !== kExpNTutorials; ++tutIdx) {
      launchNthTutorialDemo(tutIdx);
      cy.contains("Click the green flag to run");
      cy.pytchHomeFromIDE();
      cy.get(".NavBar li").contains("Tutorials").click();
    }
  });
});
