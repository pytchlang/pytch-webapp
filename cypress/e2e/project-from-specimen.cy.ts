/// <reference types="cypress" />

import { initSpecimenIntercepts, saveButton, setInstantDelays } from "./utils";
import {
  assertCostumeNames,
  launchDeleteActorByIndex,
  selectActorAspect,
  selectSprite,
  settleModalDialog,
} from "./junior/utils";

const lessonUrl = "/lesson/hello-world-lesson";

const perMethodLessonUrl = "/lesson/per-method-blue-invaders";
const perMethodProjectName = "Script-by-script Blue Invaders";

context("Create project from specimen", () => {
  function projectIdOfElt(elt: HTMLElement): number {
    const mProjectIdStr = elt.getAttribute("data-project-id");
    if (mProjectIdStr == null)
      throw new Error('no "data-project-id" attribute');
    return parseInt(mProjectIdStr);
  }

  const shouldEqualIds = (expIds: Array<number>) => ($li: JQuery) => {
    let gotIds = $li.toArray().map(projectIdOfElt);
    gotIds.sort((a, b) => a - b);

    expect(gotIds.length).eq(expIds.length);
    for (let i = 0; i !== gotIds.length; ++i) {
      expect(gotIds[i]).eq(expIds[i]);
    }
  };

  beforeEach(initSpecimenIntercepts);

  it("behaves correctly (per-method)", () => {
    const visitLessonUrl = () =>
      cy.visit(perMethodLessonUrl, { onLoad: setInstantDelays });

    const getCostume = (stem: string) => cy.get(".AssetCard").contains(stem);
    const dragCostume = (movingStem: string, targetStem: string) =>
      getCostume(movingStem).drag(getCostume(targetStem));

    const assertTitleInIDE = () =>
      cy.title().should("eq", `Pytch: ${perMethodProjectName}`);

    cy.pytchResetDatabase();

    // First visit should create and open project:
    visitLessonUrl();
    assertTitleInIDE();

    cy.get("[data-project-id]")
      .invoke("attr", "data-project-id")
      .then((idStr: string | undefined) => {
        if (idStr == null) throw new Error('no "data-project-id" attr');
        const firstId = parseInt(idStr);

        // Visiting the lesson URL should open the self-same project:
        visitLessonUrl();
        assertTitleInIDE();
        cy.get("[data-project-id]").then(shouldEqualIds([firstId]));

        // Change and save it.
        selectSprite("Alien");
        selectActorAspect("Costumes");
        dragCostume("enemy-alien", "special-alien");
        assertCostumeNames([
          "friendly-alien.png",
          "special-alien.png",
          "enemy-alien.png",
        ]);

        // Visiting the lesson URL should give choice:
        visitLessonUrl();
        cy.contains("You have already started work");
        cy.get("li.open-existing")
          .should("have.length", 1)
          .within(() => cy.contains(perMethodProjectName))
          .then(shouldEqualIds([firstId]));
        cy.get("li.start-afresh")
          .should("have.length", 1)
          .invoke("attr", "data-start-afresh-kind")
          .then((kind) => expect(kind).eq("create"));

        // Open existing and put costumes back in order:
        cy.get("li.open-existing:first-child").click();
        selectSprite("Alien");
        selectActorAspect("Costumes");
        dragCostume("enemy-alien", "friendly-alien");
        assertCostumeNames([
          "enemy-alien.png",
          "friendly-alien.png",
          "special-alien.png",
        ]);

        // Visiting the lesson URL should open the self-same project:
        visitLessonUrl();
        assertTitleInIDE();
        cy.get("[data-project-id]").then(shouldEqualIds([firstId]));

        // Delete the Alien and check this counts as a change.
        saveButton.shouldReactToInteraction(() => {
          launchDeleteActorByIndex(1);
          settleModalDialog("DELETE");
        });

        // Now we should get the choice screen again:
        visitLessonUrl();
        cy.contains("You have already started work");
        cy.get("li.open-existing")
          .should("have.length", 1)
          .within(() => cy.contains(perMethodProjectName))
          .then(shouldEqualIds([firstId]));
        cy.get("li.start-afresh")
          .should("have.length", 1)
          .invoke("attr", "data-start-afresh-kind")
          .then((kind) => expect(kind).eq("create"));
      });
  });

  it("behaves correctly (flat)", () => {
    const saveProject = () => {
      cy.get("button.unsaved-changes-exist").click();
      cy.get("button.no-changes-since-last-save");
    };

    cy.pytchResetDatabase();

    // First visit to the lesson URL should immediately create a
    // new project for it:  (Case 0)
    cy.visit(lessonUrl);
    cy.title().should("eq", "Pytch: Hello World Specimen");
    cy.get("[data-project-id]")
      .invoke("attr", "data-project-id")
      .then((idStr: string | undefined) => {
        if (idStr == null) throw new Error('no "data-project-id" attr');
        const firstId = parseInt(idStr);

        // Second visit to the lesson URL should immediately open the
        // self-same project:  (Case 1a)
        cy.visit(lessonUrl);
        cy.title().should("eq", "Pytch: Hello World Specimen");
        cy.get("[data-project-id]").then(shouldEqualIds([firstId]));

        // And there should be just that one new project (besides the
        // one created for all tests):
        cy.pytchHomeFromIDE();
        cy.contains("My projects").click();
        cy.pytchProjectNamesShouldDeepEqual([
          "Hello World Specimen",
          "Test seed project",
        ]);

        // Open that project, change it, save it:
        cy.pytchOpenProject("Hello World Specimen");
        cy.get("#pytch-ace-editor").type("{enter}# Different.{enter}");
        saveProject();

        // Now visiting the lesson URL should offer options to: create a
        // genuinely new project; to open that sole existing project.
        // (Case 1b)
        cy.visit(lessonUrl);
        cy.contains("You have already started work");
        cy.get("li.open-existing")
          .should("have.length", 1)
          .within(() => cy.contains("Hello World Specimen"))
          .then(shouldEqualIds([firstId]));
        cy.get("li.start-afresh")
          .should("have.length", 1)
          .invoke("attr", "data-start-afresh-kind")
          .then((kind) => expect(kind).eq("create"));

        // Choose to create a new one.
        cy.get("button").contains("Start again").click();

        // Change and save /that/ project.
        cy.title().should("eq", "Pytch: Hello World Specimen");
        cy.get("#pytch-ace-editor").type("{enter}# Different again.{enter}");
        saveProject();
        cy.get("[data-project-id]")
          .invoke("attr", "data-project-id")
          .then((idStr: string | undefined) => {
            if (idStr == null) throw new Error('no "data-project-id" attr');
            const secondId = parseInt(idStr);
            const bothIds = [firstId, secondId];

            // Now the lesson URL should offer options to: genuinely
            // create a new project; or open either of the existing
            // ones.  (Case Na)
            cy.visit(lessonUrl);
            cy.contains("You have already started work");
            cy.get("li.start-afresh")
              .should("have.length", 1)
              .invoke("attr", "data-start-afresh-kind")
              .then((kind) => expect(kind).eq("create"));

            cy.get("li.open-existing")
              .should("have.length", 2)
              .then(shouldEqualIds(bothIds));

            // Create a new one and leave it unchanged.
            cy.get("button").contains("Start again").click();
            // Wait for creation process to complete:
            cy.get(".IDELayout[data-project-id]");

            // Now the lesson URL should offer what seems to be the same
            // options, but in fact the "start again" option will open
            // the just-created project.  (Case Nb)
            cy.visit(lessonUrl);
            cy.contains("You have already started work");
            cy.get("li.start-afresh")
              .should("have.length", 1)
              .invoke("attr", "data-start-afresh-kind")
              .then((kind) => expect(kind).eq("open-existing-identical"));
            cy.get("li.open-existing")
              .should("have.length", 2)
              .then(shouldEqualIds(bothIds));

            // Open the first-shown existing project (which should be
            // the second-created one, because more recent) and change
            // it back to the original content.
            cy.get("li.open-existing:first-child").click();
            cy.title().should("eq", "Pytch: Hello World Specimen");
            cy.get("[data-project-id]").then(shouldEqualIds([secondId]));
            cy.pytchSetCodeRaw('import pytch\n\nprint("Hello world!")');
            // Make sure the app knows we've made a change:
            cy.get("#pytch-ace-editor").type("X{backspace}");
            saveProject();

            // Now the lesson URL should offer a "start again" option
            // which in fact will open the project we just put back to
            // its original content, and the one linked but modified
            // existing project.
            cy.visit(lessonUrl);
            cy.contains("You have already started work");
            cy.get("li.start-afresh")
              .should("have.length", 1)
              .invoke("attr", "data-start-afresh-kind")
              .then((kind) => expect(kind).eq("open-existing-identical"));
            cy.get("li.open-existing")
              .should("have.length", 1)
              .then(shouldEqualIds([firstId]));

            // Choose "start again"; should give us the project we just
            // changed.
            cy.get("li.start-afresh").click();
            cy.title().should("eq", "Pytch: Hello World Specimen");
            cy.get("[data-project-id]").then(shouldEqualIds([secondId]));

            // From the lesson URL, choose the "carry on" option and
            // edit its contents back to the original.
            cy.visit(lessonUrl);
            cy.get("li.open-existing").click();
            cy.title().should("eq", "Pytch: Hello World Specimen");
            cy.get("[data-project-id]").then(shouldEqualIds([firstId]));
            cy.pytchSetCodeRaw('import pytch\n\nprint("Hello world!")');
            // Make sure the app knows we've made a change:
            cy.get("#pytch-ace-editor").type("X{backspace}");
            saveProject();

            // After all that, "My projects" should contain three
            // specimen-linked projects, plus the test seed one:
            cy.pytchHomeFromIDE();
            cy.contains("My projects").click();
            cy.pytchProjectNamesShouldDeepEqual([
              "Hello World Specimen",
              "Hello World Specimen",
              "Hello World Specimen",
              "Test seed project",
            ]);

            // Now we should get the most-recently-edited identical project when
            // we visit the lesson URL.
            cy.visit(lessonUrl);
            cy.title().should("eq", "Pytch: Hello World Specimen");
            cy.get("[data-project-id]").then(shouldEqualIds([firstId]));
          });
      });
  });

  it("shows linked-content activity content (flat)", () => {
    cy.pytchResetDatabase();

    // Create and open new project from specimen.
    cy.visit(lessonUrl);
    cy.get(".activity-bar-tabs > *").should("have.length", 2);
    cy.get(".activity-content-expanded-specimen .specimen-name").contains(
      "Hello World Specimen"
    );

    // The test seed project should not have the option of linked
    // content information.
    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.pytchOpenProject("Test seed project");
    cy.get(".activity-content-expanded-helpsidebar");
    cy.get(".activity-bar-tabs > *").should("have.length", 1);
  });

  it("shows linked-content activity pane (per-method)", () => {
    // Create and open new project from specimen.
    cy.visit(perMethodLessonUrl);
    cy.get(".Junior-LessonContent-HeaderBar").contains(perMethodProjectName);

    // Click around a bit.

    cy.get(".ActivityBarTab.tab-key-specimen").click();
    cy.get(".Junior-LessonContent-HeaderBar").should("not.exist");

    cy.get(".HelpSidebar").should("not.exist");
    cy.get(".ActivityBarTab.tab-key-helpsidebar").click();
    cy.get(".HelpSidebar");

    cy.get(".ActivityBarTab.tab-key-specimen").click();
    cy.get(".Junior-LessonContent-HeaderBar").contains(perMethodProjectName);
  });

  it("includes project name in zipfile name", () => {
    cy.pytchResetDatabase();
    cy.visit(lessonUrl);

    // Wait for linked content to load.
    cy.get(".activity-content-expanded-specimen .specimen-name").contains(
      "Hello World"
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then(async (window: any) => {
      let pytchCypress = window.PYTCH_CYPRESS;
      // The cy.visit() call resets instantDelays from the "true" value
      // set in pytchResetDatabase(); put it back:
      pytchCypress.instantDelays = true;
      pytchCypress.latestDownloadZipfile = null;

      const latestDownload = () => pytchCypress.latestDownloadZipfile;

      cy.pytchChooseDropdownEntry("Download");
      cy.get(".CompoundTextInput input").type("Ben");
      cy.get("button").contains("Download").click();

      cy.waitUntil(() => latestDownload() != null).then(async () => {
        const download = latestDownload();
        expect(download.filename).equal("Ben - Hello World Specimen.zip");
      });
    });
  });
});

context("Compare user code to original", () => {
  beforeEach(initSpecimenIntercepts);

  it("can launch and dismiss modal", () => {
    cy.visit(lessonUrl);
    cy.get("button").contains("Compare to original").click();
    cy.get(".ViewCodeDiffModal").find("button").contains("Close").click();
    cy.get(".ViewCodeDiffModal").should("not.exist");
  });
});
