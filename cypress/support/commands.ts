// Additional commands for testing Pytch.

import "cypress-file-upload";
import "cypress-wait-until";
import "./drag-drop";

import {
  ArrayRGBA,
  ContentMatch,
  PytchErrorKind,
  ResetDatabaseOptions,
} from "./types";

import { IAceEditor } from "react-ace/lib/types";
import {
  stageHalfHeight,
  stageHalfWidth,
  stageHeight,
  stageWidth,
} from "../../src/constants";
import { DexieStorage } from "../../src/database/indexed-db";
import { ProjectId } from "../../src/model/project-core";
import { deIndent } from "../common/utils";
import { assertOnHomepage } from "../e2e/utils";

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

const resetDatabaseDefaults: Required<ResetDatabaseOptions> = {
  initialUrl: "/",
  extraAssets: [],
  extraProjectNames: [],
  extraWindowActions: [],
};

Cypress.Commands.add("pytchResetDatabase", (options?: ResetDatabaseOptions) => {
  let effectiveOptions = { ...resetDatabaseDefaults, ...options };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cy.visit(effectiveOptions.initialUrl).then(async (window: any) => {
    const db = window.PYTCH_CYPRESS.PYTCH_DB as DexieStorage;
    window.PYTCH_CYPRESS.instantDelays = true;
    await db.dangerDangerDeleteEverything();

    effectiveOptions.extraWindowActions.forEach((a) => a(window));

    const allProjectNames = [
      "Test seed project",
      ...effectiveOptions.extraProjectNames,
    ];
    const projectSummaries = await Promise.all(
      allProjectNames.map((name) => db.createNewProject(name, {}))
    );
    const projectSummary = projectSummaries[0];
    window.PYTCH_CYPRESS.nonExistentProjectId = projectSummary.id - 1;

    const allFixtureAssets = [
      { name: "red-rectangle-80-60.png", mimeType: "image/png" },
      { name: "sine-1kHz-2s.mp3", mimeType: "audio/mpeg" },
      ...effectiveOptions.extraAssets,
    ];

    for (const { name, mimeType } of allFixtureAssets) {
      addAssetFromFixture(db, projectSummary.id, name, mimeType);
    }
  });
});

Cypress.Commands.add(
  "pytchExactlyOneProject",
  (resetDatabaseOptions?: ResetDatabaseOptions) => {
    cy.pytchResetDatabase(resetDatabaseOptions);
    cy.contains("My projects").click();
    cy.contains("Test seed project").click();
    cy.contains("Images and sounds");
    cy.get(".ReadOnlyOverlay").should("not.exist");
  }
);

Cypress.Commands.add("pytchBasicJrProject", () => {
  cy.pytchResetDatabase();
  cy.pytchTryUploadZipfiles(["newly-created-per-method.zip"]);
  cy.get("div.modal.show").should("not.exist");
  cy.get(".NoContentHelp");
});

Cypress.Commands.add("pytchJrLesson", () => {
  cy.pytchResetDatabase();
  cy.contains("Tutorials").click();
  cy.get('.TutorialCard[data-slug="script-by-script-catch-apple"]')
    .contains("Tutorial")
    .click();
});

Cypress.Commands.add("pytchOpenProject", (name: string) => {
  cy.contains("My projects");
  cy.contains(name).click();

  // Look for an essentially arbitrary element which should be present
  // once the IDE has rendered:
  cy.get("button").contains("Save");

  // And also wait for the loading to complete:
  cy.get(".ReadOnlyOverlay").should("not.exist");
});

Cypress.Commands.add(
  "pytchTryUploadZipfiles",
  (zipBasenames: Array<string>) => {
    cy.contains("My projects").click();
    cy.get("button").contains("Upload").click();
    const filenames = zipBasenames.map(
      (basename) => `project-zipfiles/${basename}`
    );
    cy.get('.form-control[type="file"]').attachFile(
      filenames.map((filePath) => ({ filePath, encoding: "binary" }))
    );
    cy.get(".modal-footer").contains("Upload").click();
    cy.get(".modal-footer").should("not.exist");
  }
);

Cypress.Commands.add(
  "pytchProjectNamesShouldDeepEqual",
  (expectedNames: Array<string>) =>
    cy.get(".project-name").should(($spans) => {
      const display = (xs: Array<string>) =>
        `[${xs.map((s) => `"${s}"`).join(", ")}]`;

      const gotNames = $spans.toArray().map((span) => span.innerText);

      const gotDisplay = display(gotNames);
      const expDisplay = display(expectedNames);
      const message = `got ${gotDisplay}; exp ${expDisplay}`;

      expect(gotNames, message).deep.equal(expectedNames);
    })
);

Cypress.Commands.add("pytchHomeFromIDE", () => {
  cy.get('button *[aria-label="Home"]').click();
  assertOnHomepage();
});

Cypress.Commands.add("pytchSwitchProject", (name: string) => {
  cy.pytchHomeFromIDE();
  cy.contains("My projects").click();
  cy.pytchOpenProject(name);
});

export type CreateProjectTutorialOptions = {
  resetDatabaseFirst: boolean;
};
const defaultCreateProjectTutorialOptions: CreateProjectTutorialOptions = {
  resetDatabaseFirst: true,
};
const createTutorialProject = (
  tutorialSlug: string,
  buttonContent: string,
  options?: Partial<CreateProjectTutorialOptions>
) => {
  const fullOptions: CreateProjectTutorialOptions = Object.assign(
    {},
    defaultCreateProjectTutorialOptions,
    options
  );

  if (fullOptions.resetDatabaseFirst) {
    cy.pytchResetDatabase();
  }

  cy.contains("My projects").click();
  cy.contains("Tutorials").click();
  cy.get(`.TutorialCard[data-slug="${tutorialSlug}"]`).within(() => {
    cy.contains(buttonContent).click();
  });

  // More/less as per pytchOpenProject() above, except don't let it get
  // fooled by the buttons on the tutorials page:
  cy.get(".Junior-InfoPanel");
  cy.get(".ReadOnlyOverlay").should("not.exist");

  cy.pytchHomeFromIDE();
  cy.contains("My projects").click();
  cy.get(".ProjectCard").contains(`"${tutorialSlug}"`).click();
};

Cypress.Commands.add(
  "pytchProjectFollowingTutorial",
  (tutorialSlug = "boing", options?: Partial<CreateProjectTutorialOptions>) =>
    createTutorialProject(tutorialSlug, "Tutorial", options)
);

Cypress.Commands.add(
  "pytchProjectDemonstratingTutorial",
  (tutorialSlug = "boing") => createTutorialProject(tutorialSlug, "Demo")
);

Cypress.Commands.add(
  "pytchShouldShowAssets",
  (expectedNames: Array<string>) => {
    const nExpNames = expectedNames.length;
    cy.get(".AssetCardContent .label pre")
      .should("have.length", nExpNames)
      .then(($codes) => {
        const orderedExpectedNames = [...expectedNames];
        orderedExpectedNames.sort();
        const gotNames = $codes.toArray().map((c) => c.innerText);
        gotNames.sort();
        expect(gotNames).to.eql(orderedExpectedNames);
      });
  }
);

// Pick out the editor interface stored by the app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const aceEditorFromWindow = (window: any): IAceEditor =>
  window.PYTCH_CYPRESS.ACE_CONTROLLER;

Cypress.Commands.add("pytchFocusEditor", () => {
  cy.window().then((window) => {
    aceEditorFromWindow(window).focus();
  });
});

Cypress.Commands.add("pytchSetCodeRaw", (codeText: string) => {
  cy.window().then((window) => {
    const aceEditor = aceEditorFromWindow(window);
    aceEditor.setValue(codeText);
    aceEditor.clearSelection();
    aceEditor.gotoLine(0, 0, true);
  });
});

Cypress.Commands.add("pytchSetCodeWithDeIndent", (indentedCodeText: string) => {
  const codeText = deIndent(indentedCodeText);
  cy.pytchSetCodeRaw(codeText);
});

Cypress.Commands.add("pytchBuild", () => {
  const kStageSelector = "#pytch-stage-container";
  cy.get(kStageSelector).then(($div) => {
    cy.wrap($div).should("have.length", 1);
    const preBuildSeqnum = parseInt($div[0].dataset.buildSeqnum ?? "-100");
    cy.get(".GreenFlag").click();
    const expPostBuildSeqnumStr = (preBuildSeqnum + 1).toFixed(0);
    cy.get(kStageSelector)
      .invoke("attr", "data-build-seqnum")
      .should("eq", expPostBuildSeqnumStr);
  });
});

Cypress.Commands.add("pytchBuildCode", (rawCodeText: string) => {
  cy.pytchSetCodeWithDeIndent(rawCodeText);
  cy.get(".Junior-InfoPanel .nav-link").contains("Output").click();
  cy.pytchBuild();
});

Cypress.Commands.add("pytchCodeTextShouldEqual", (expectedCode: string) => {
  cy.window().then((window) => {
    const aceEditor = aceEditorFromWindow(window);
    expect(aceEditor.getValue()).to.equal(expectedCode);
  });
});

Cypress.Commands.add("pytchCodeTextShouldContain", (match: string) => {
  cy.window().then((window) => {
    const aceEditor = aceEditorFromWindow(window);
    expect(aceEditor.getValue()).to.contain(match);
  });
});

const getStdoutElement = () => {
  cy.get(".nav-item").contains("Output").click();
  return cy.get(".SkulptStdout");
};

Cypress.Commands.add("pytchStdoutShouldContain", (match: string) => {
  cy.focused().as("startingFocusElt", { type: "static" });
  getStdoutElement().should("contain.text", match);
  cy.get("@startingFocusElt").focus();
});

Cypress.Commands.add("pytchStdoutShouldEqual", (match: string) => {
  cy.focused().as("startingFocusElt", { type: "static" });
  getStdoutElement().should("have.text", match);
  cy.get("@startingFocusElt").focus();
});

Cypress.Commands.add(
  "pytchCanvasShouldBeSolidColour",
  (expectedColour: ArrayRGBA) => {
    cy.waitUntil(() =>
      cy.get("#pytch-canvas").then(($canvas) => {
        const canvas = $canvas[0] as HTMLCanvasElement;
        const ctx = canvas.getContext("2d");
        if (ctx == null) throw new Error("could not get 2d context");
        const pixels = ctx.getImageData(0, 0, stageWidth, stageHeight);
        let allOK = true;
        const nPixels = stageWidth * stageHeight;
        for (let pixelIdx = 0; pixelIdx !== nPixels; ++pixelIdx) {
          const u8Idx = pixelIdx * 4;
          if (
            pixels.data[u8Idx] !== expectedColour[0] ||
            pixels.data[u8Idx + 1] !== expectedColour[1] ||
            pixels.data[u8Idx + 2] !== expectedColour[2] ||
            pixels.data[u8Idx + 3] !== expectedColour[3]
          )
            allOK = false;
        }
        return allOK;
      })
    );
  }
);

Cypress.Commands.add("pytchShouldHaveBuiltWithoutErrors", () => {
  cy.get(".Junior-InfoPanel .nav-link")
    .contains("Errors")
    .should("not.have.class", "active")
    .click();

  cy.get(".ErrorReportAlert").should("not.exist");
});

const shouldBeShowingErrorPane = (infoPanelClass = "Junior-InfoPanel") => {
  cy.get(`.${infoPanelClass} .nav-link`)
    .contains("Errors")
    .should("have.class", "active");
};

Cypress.Commands.add("pytchShouldShowErrorContext", (match: ContentMatch) => {
  shouldBeShowingErrorPane();
  cy.get(".error-pane-intro").contains(match);
});

const assertionArgsForErrorKind = (kind: PytchErrorKind): [string, string] => {
  const internalErrorMarkerText = "Unfortunately there is no more information";
  switch (kind) {
    case "user-space":
      return ["not.contain.text", internalErrorMarkerText];
    case "internal":
      return ["contain.text", internalErrorMarkerText];
    default:
      throw Error("unknown error kind");
  }
};

Cypress.Commands.add(
  "pytchShouldShowErrorCard",
  (match: ContentMatch, kind: PytchErrorKind, infoPanelClass?: string) => {
    shouldBeShowingErrorPane(infoPanelClass);
    cy.get(".ErrorReportAlert")
      .contains(match)
      .parentsUntil(".ErrorReportAlert")
      .parent()
      .should(...assertionArgsForErrorKind(kind));
  }
);

Cypress.Commands.add(
  "pytchShouldShowJuniorErrorCard",
  (match: ContentMatch, kind: PytchErrorKind) =>
    cy.pytchShouldShowErrorCard(match, kind, "Junior-InfoPanel")
);

Cypress.Commands.add(
  "pytchShouldHaveErrorStackTraceOfLength",
  (nFrames: number) => {
    shouldBeShowingErrorPane();
    cy.get(".stack-trace-frame-summary").should("have.length", nFrames);
  }
);

Cypress.Commands.add("pytchGreenFlag", () => {
  cy.get(".GreenFlag").click();
});

Cypress.Commands.add("pytchRedStop", () => {
  cy.get(".RedStop").click();
});

Cypress.Commands.add("pytchChooseDropdownEntry", (entryName: string) => {
  cy.get(".StageControls").contains("⋮").click();
  cy.get(".dropdown-item").contains(entryName).click();
});

Cypress.Commands.add("pytchSendKeysToProject", (keys: string) => {
  cy.get("#pytch-speech-bubbles").type(keys);
});

Cypress.Commands.add("pytchClickStage", (stageX: number, stageY: number) => {
  cy.get("#pytch-speech-bubbles").then(($e) => {
    const div = $e[0];

    // Translate and scale; also flip y-coord:
    const elementX = ((stageX + stageHalfWidth) / stageWidth) * div.clientWidth;
    const elementY =
      div.clientHeight -
      ((stageY + stageHalfHeight) / stageHeight) * div.clientHeight;

    cy.wrap($e).click(elementX, elementY);
  });
});

Cypress.Commands.add("pytchSendKeysToApp", (keys: string) => {
  cy.focused().type(keys);
});

Cypress.Commands.add("pytchRunThroughButtonTour", () => {
  cy.contains("Click the green flag");
  cy.pytchGreenFlag();
  cy.contains("Click the green flag").should("not.be.visible");
});

function doNothing() {
  /* Do nothing. */
}

Cypress.Commands.add(
  "pytchActivateAssetDropdown",
  (assetName: string, maybeChooseItem = doNothing) => {
    cy.get(".AssetCardContent .label")
      .contains(assetName)
      .parent()
      .parent()
      .parent()
      .within(() => {
        cy.get(".dropdown").click();
        maybeChooseItem();
      });
  }
);

Cypress.Commands.add(
  "pytchClickAssetDropdownItem",
  (assetName: string, itemName: string) => {
    const clickItem = () => cy.contains(itemName).click();
    cy.pytchActivateAssetDropdown(assetName, clickItem);
  }
);

Cypress.Commands.add(
  "assertCausesToVanish",
  (selector: string, actionFun: () => void) => {
    cy.get(selector).should("have.length", 1).should("be.visible");
    actionFun();
    cy.get(selector).should("not.exist");
  }
);
