/// <reference types="cypress" />
const initIntercepts = () => {
  cy.intercept("GET", "**/hello-world-lesson.zip", {
    fixture: "lesson-specimens/hello-world-lesson.zip",
  });
  cy.intercept("GET", "**/_by_content_hash_/*f4db652fe09e1663.zip", {
    fixture: "lesson-specimens/hello-world-lesson.zip",
  });
};

const lessonUrl = "/lesson/hello-world-lesson";

context("Create project from specimen", () => {
  beforeEach(() => {
    initIntercepts();
  });

  it("behaves correctly", () => {
    const saveProject = () => cy.get("button.unsaved-changes-exist").click();

    const shouldEqualIds = (expIds: Array<number>) => ($li: JQuery) => {
      let gotIds = $li
        .toArray()
        .map((elt: HTMLElement) =>
          parseInt(elt.getAttribute("data-project-id"))
        );
      gotIds.sort((a, b) => a - b);

      expect(gotIds.length).eq(expIds.length);
      for (let i = 0; i != gotIds.length; ++i) {
        expect(gotIds[i]).eq(expIds[i]);
      }
    };

    cy.pytchResetDatabase();

    // First visit to the lesson URL should immediately create a
    // new project for it:  (Case 0)
    cy.visit(lessonUrl);
    cy.title().should("eq", "Pytch: Hello World Specimen");
    cy.get("[data-project-id]")
      .invoke("attr", "data-project-id")
      .then((idStr: string) => {
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
          .then((idStr: string) => {
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
          });
      });
  });

  it("shows linked-content top bar", () => {
    cy.pytchResetDatabase();

    // Create and open new project from specimen.
    cy.visit(lessonUrl);
    cy.get(".LinkedContentBar.linked-content").contains("Hello World Specimen");

    // The test seed project should not have a (non-empty) content bar.
    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.pytchOpenProject("Test seed project");
    cy.get(".LinkedContentBar.no-linked-content");
  });

  it("includes project name in zipfile name", () => {
    cy.pytchResetDatabase();
    cy.visit(lessonUrl);

    // Wait for linked content to load.
    cy.get(".LinkedContentBar.linked-content").contains("Hello World");

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
  beforeEach(() => {
    initIntercepts();
  });

  it("can launch and dismiss modal", () => {
    cy.visit(lessonUrl);
    cy.get(".LinkedContentBar.linked-content .dropdown button").click();
    cy.contains("Compare to original").click();
    cy.get(".ViewCodeDiffModal").find("button").contains("Close").click();
    cy.get(".ViewCodeDiffModal").should("not.exist");
  });
});
