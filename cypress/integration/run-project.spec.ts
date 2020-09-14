/// <reference types="cypress" />

context("Build and run projects", () => {
  before(() => {
    cy.visit("http://localhost:3000/").then((window) => {
      window.indexedDB.deleteDatabase("pytch");
    });
    cy.contains("My projects").click();
    cy.contains("Create a new project").click();
    cy.get("input[type=text]").type("Test project");
    cy.get("button").contains("Create project").click();
    cy.contains("Test project").click();
    cy.contains("Images and sounds");
  });

  const allSpaces = new RegExp("^ *$");
  const initialSpaces = new RegExp("^ *");
  const deIndent = (rawCode: string): string => {
    const allLines = rawCode.split("\n");

    if (allLines[0] !== "") {
      throw Error("need empty first line of code");
    }
    const nLines = allLines.length;
    if (!allSpaces.test(allLines[nLines - 1])) {
      throw Error("need all-spaces last line of code");
    }

    const lines = allLines.slice(1, nLines - 1);
    const lineIndents = lines.map((line) => initialSpaces.exec(line)[0].length);
    const minIndent = Math.min(...lineIndents);
    const strippedLines = lines.map((line) => line.substring(minIndent));
    return strippedLines.join("\n") + "\n";
  };
});
