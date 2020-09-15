// Additional commands for testing Pytch.

import { IAceEditor } from "react-ace/lib/types";
import { DexieStorage } from "../../src/database/indexed-db";
import { ProjectId } from "../../src/model/projects";

const ArrayBufferFromString = (strData: string) => {
  const data = new Uint8Array(strData.length);
  for (let i = 0; i < data.byteLength; ++i) {
    data[i] = strData.charCodeAt(i);
  }
  return data.buffer;
};

// TODO: I'm not 100% sure I'm using Cypress correctly here, considering
// the mixture of promises and functions explicitly returning promises.
// Seems to be working, but would be good to actually understand what's
// going on.
const addAssetFromFixture = (
  db: DexieStorage,
  projectId: ProjectId,
  basename: string,
  mimeType: string
) => {
  cy.fixture(`sample-project-assets/${basename}`, "binary").then(
    (strData: string) => {
      const data = ArrayBufferFromString(strData);
      return db.addAssetToProject(projectId, basename, mimeType, data);
    }
  );
};

Cypress.Commands.add("pytchResetDatabase", () => {
  cy.visit("http://localhost:3000/").then(async (window) => {
    const db = (window as any).PYTCH_CYPRESS.PYTCH_DB;
    await db.dangerDangerDeleteEverything();

    const projectSummary = await db.createNewProject("Test seed project");

    for (const { name, mimeType } of [
      { name: "red-rectangle-80-60.png", mimeType: "image/png" },
      { name: "sine-1kHz-2s.mp3", mimeType: "audio/mpeg" },
    ]) {
      addAssetFromFixture(db, projectSummary.id, name, mimeType);
    }
  });
});

Cypress.Commands.add("pytchExactlyOneProject", () => {
  cy.pytchResetDatabase();
  cy.contains("My projects").click();
  cy.contains("Test seed project").click();
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

  const nonBlankLines = lines.filter((line) => !allSpaces.test(line));
  const nonBlankIndents = nonBlankLines.map(
    (line) => initialSpaces.exec(line)[0].length
  );
  const minNonBlankIndent = Math.min(...nonBlankIndents);

  const strippedLines = lines.map((line) => line.substring(minNonBlankIndent));
  return strippedLines.join("\n") + "\n";
};

// Pick out the editor interface stored by the app.
const aceEditorFromWindow = (window: any): IAceEditor =>
  (window as any).PYTCH_CYPRESS.ACE_CONTROLLER;

const setCodeWithDeIndent = (indentedCodeText: string) => {
  const codeText = deIndent(indentedCodeText);
  cy.window().then((window) => {
    const aceEditor = aceEditorFromWindow(window);
    aceEditor.setValue(codeText);
    aceEditor.clearSelection();
    aceEditor.gotoLine(0, 0, true);
  });
};

Cypress.Commands.add("pytchBuild", () => {
  cy.get("button").contains("BUILD").click();
});

Cypress.Commands.add("pytchBuildCode", (rawCodeText: string) => {
  setCodeWithDeIndent(rawCodeText);
  cy.contains("Images and sounds").click();
  cy.pytchBuild();
});

Cypress.Commands.add("pytchStdoutShouldContain", (match: ContentMatch) => {
  cy.get(".nav-item").contains("Output").click();
  cy.get(".SkulptStdout").then(($p) => {
    expect($p[0].innerText).to.contain(match);
  });
});

Cypress.Commands.add("pytchShouldHaveBuiltWithoutErrors", () => {
  cy.get(".InfoPanel .nav-link")
    .contains("Errors")
    .should("not.have.class", "active")
    .click();

  cy.get(".ErrorReportAlert").should("not.exist");
});

Cypress.Commands.add("pytchShouldShowErrorCard", (match: ContentMatch) => {
  cy.get(".InfoPanel .nav-link")
    .contains("Errors")
    .should("have.class", "active");

  cy.get(".ErrorReportAlert").contains(match);
});
