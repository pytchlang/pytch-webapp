import { PytchProgramKind } from "../../src/model/pytch-program";
import { assertNever, promiseAndResolve } from "../../src/utils";

export const kExpNTutorials = 18;

/** Set up request intercepts for a specimen for use in tests. */
export function initSpecimenIntercepts() {
  cy.intercept("GET", "**/hello-world-lesson.zip", {
    fixture: "lesson-specimens/hello-world-lesson.zip",
  });
  cy.intercept("GET", "**/_by_content_hash_/*f4db652fe09e1663.zip", {
    fixture: "lesson-specimens/hello-world-lesson.zip",
  });
  cy.intercept("GET", "**/per-method-blue-invaders.zip", {
    fixture: "lesson-specimens/per-method-blue-invaders.zip",
  });
  cy.intercept("GET", "**/_by_content_hash_/*051713cf816591ae.zip", {
    fixture: "lesson-specimens/per-method-blue-invaders.zip",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setInstantDelays(window: any) {
  window.PYTCH_CYPRESS.instantDelays = true;
}

/** Object with function properties to help with testing behaviour of
 * the Save button.  In most cases, tests should be able to use:
 *
 * * `shouldReactToInteraction(interaction)` — assert that the Save
 *   button is unlit; perform the given `interaction()`; assert that the
 *   Save button is lit; click it; assert that it's not lit.
 *
 * The following finer-grained functions also exist if more control is
 * needed:
 *
 * * `click()` — click the Save button
 * * `shouldShowNoUnsavedChanges()` — assert that the Save button is in
 *   its normal, unhighlighted state, indicating that there are no
 *   unsaved changes
 * * `shouldShowUnsavedChanges()` — assert that the Save button is in
 *   its highlighted state, indicating that there **are** unsaved
 *   changes
 *   */
export const saveButton = (() => {
  const button = () => cy.get("button.save-button");
  const assertClass = (cls: string) => () => button().should("have.class", cls);

  const click = () => button().click();
  const shouldShowNoUnsavedChanges = assertClass("no-changes-since-last-save");
  const shouldShowUnsavedChanges = assertClass("unsaved-changes-exist");

  return {
    click,
    shouldShowNoUnsavedChanges,
    shouldShowUnsavedChanges,
    shouldReactToInteraction(interaction: () => void) {
      shouldShowNoUnsavedChanges();
      interaction();
      shouldShowUnsavedChanges();
      click();
      shouldShowNoUnsavedChanges();
    },
  };
})();

/** Set up a Cypress `intercept()` for the demo zipfile whose filename
 * has the given `demoStem`. */
export function interceptDemoZipfile(demoStem: string) {
  cy.intercept("GET", `**/fake-build-id-for-tests/${demoStem}.zip`, {
    fixture: `project-zipfiles/${demoStem}.zip`,
  });
}

/** Assuming we're on the "My projects" page, open the dropdown menu for
 * the unique project whose name matches the given `projectName`, and
 * choose the unique dropdown item whose name matches the given
 * `actionName`. */
export const launchProjectInListDropdownAction = (
  projectName: string,
  actionName: string
) => {
  cy.get(".project-name")
    .contains(projectName)
    .should("have.length", 1)
    .parent()
    .parent()
    .parent()
    .within(() => {
      cy.get(".dropdown").click();
      cy.contains(actionName).should("have.length", 1).click();
    });
  cy.get(".modal").should("have.length", 1).should("be.visible");
};

/** Assuming we're on the "My projects" page, select (for potential
 * deletion) the unique project matching the given `name`. */
export const selectUniqueProject = (name: string) => {
  cy.contains(name)
    .should("have.length", 1)
    .parent()
    .parent()
    .find("span.selection-check")
    // "force" in case list is long and project is out of viewport:
    .click({ force: true });
};

/** Assuming we're on the "Tutorials" page, launch the Share modal for
 * the unique tutorial whose name matches the given `nameMatch`. */
export const launchShareTutorialModal = (nameMatch: string) => {
  cy.get("ul.tutorial-list li")
    .contains(nameMatch)
    .should("have.length", 1)
    .parent()
    .within(() => {
      cy.get("button").contains("Share").click();
    });
};

/** Assuming we're on the "My project" page, launch the "Create project"
 * modal and, if `name` is supplied, type that `name` into the text-box
 * to provide a name for the to-be-created project. */
export function launchCreateProjectModal(name?: string) {
  cy.get("button").contains("Create new").click();
  if (name != null) {
    cy.get("input[type=text]").clear().type(name);
  }
}

export function assertOnHomepage() {
  cy.get(".welcome-text .CodingJourney");
}

/** Assert that text satisfying the given predicate `textIsExpected()`
 * has been copied to the clipboard.  (Note that this test cannot
 * actually inspect the contents of the clipboard, so it relies on the
 * code under test using the utility function `copyTextToClipboard()`.)
 * */
export function assertCopiedText(textIsExpected: (text: string) => boolean) {
  cy.waitUntil(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then((win: any) => {
      const copiedText: string = win["PYTCH_CYPRESS"]["latestTextCopied"] ?? "";
      return textIsExpected(copiedText);
    })
  );
}

/** Assert that the webapp is on the IDE for a program of the given
 * `programKind`, and that the program has finished loading. */
export function assertInIDE(programKind: PytchProgramKind) {
  cy.get(".ReadOnlyOverlay").should("not.exist");

  switch (programKind) {
    case "flat":
      cy.get(".EditorAndOutErr > .CodeEditor");
      cy.get(".StageAndActorsOrAssets").contains("Images and sounds");
      return;
    case "per-method":
      cy.get(".EditorAndOutErr > .Junior-ActorProperties-container");
      cy.get(".StageAndActorsOrAssets").contains("Stage and sprites");
      return;
    default:
      assertNever(programKind);
  }
}

/** Assuming that the webapp is in the IDE for a project which is
 * tracking (or linked to) a tutorial, use the progress trail to jump to
 * the chapter at the given `chapterIndex`. */
export function jumpToTutorialChapter(chapterIndex: number) {
  const selector = `.progress-node-hover-target[data-chapter-index="${chapterIndex}"]`;
  cy.get(selector).click();
}

////////////////////////////////////////////////////////////////////////

interface IWindowWithGatedDelay {
  PYTCH_CYPRESS: { liveGatedDelay?: GatedDelay };
}

export class GatedDelay {
  delayPromise: Promise<void>;
  resolveDelay: () => void;
  window: IWindowWithGatedDelay;

  constructor(window: IWindowWithGatedDelay) {
    const { promise, resolve } = promiseAndResolve();
    this.delayPromise = promise;
    this.resolveDelay = resolve;
    this.window = window;
  }

  release() {
    this.resolveDelay();
    delete this.window.PYTCH_CYPRESS["liveGatedDelay"];
  }

  static installNew(win: IWindowWithGatedDelay) {
    const gatedDelay = new GatedDelay(win);
    win.PYTCH_CYPRESS["liveGatedDelay"] = gatedDelay;
    return gatedDelay;
  }
}
