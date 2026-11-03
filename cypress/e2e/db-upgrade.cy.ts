/// <reference types="cypress" />

import Dexie from "dexie";

// Contents of the projectSummaries and projectPytchPrograms tables, as
// captured from a v7 database created by the app.
type V7DatabaseDump = {
  nativeVersion: number;
  projectSummaries: Array<{ id: number; name: string }>;
  projectPytchPrograms: Array<{ projectId: number }>;
};

context("Upgrade of database", () => {
  // Create, from scratch, a v7 "pytch" database containing the given
  // records.  The records keep their ids, so programs still match their
  // projects.
  const seedV7Database = (dump: V7DatabaseDump) => {
    expect(dump.nativeVersion).equal(70);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then(async (window: any) => {
      const dbOptions = {
        indexedDB: window.indexedDB,
        IDBKeyRange: window.IDBKeyRange,
      };

      window.PYTCH_CYPRESS.PYTCH_DB.close();
      await new Dexie("pytch", dbOptions).delete();

      const db = new Dexie("pytch", dbOptions);
      db.version(7).stores({
        projectSummaries: "++id",
        projectPytchPrograms: "projectId",
        projectAssets: "++id, projectId, &[projectId+name]",
        assets: "id",
      });

      await db.table("projectSummaries").bulkAdd(dump.projectSummaries);
      await db.table("projectPytchPrograms").bulkAdd(dump.projectPytchPrograms);

      db.close();
    });
  };

  it("converts tracked tutorial to linked content (v8)", () => {
    cy.visit("/");
    cy.fixture("db-upgrade/captured-v7-data.json").then(seedV7Database);

    // Re-load the app, which will upgrade the database.
    cy.visit("/");

    cy.fixture("db-upgrade/captured-v7-data.json").then(
      (dump: V7DatabaseDump) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cy.window().then(async (window: any) => {
          const db = window.PYTCH_CYPRESS.PYTCH_DB;
          const summaries = await db.projectSummaries.toArray();
          const v7SummaryWithId = (id: number) =>
            dump.projectSummaries.find((s) => s.id === id);

          // The "flat" tutorial's tracked-tutorial ref has been
          // replaced by an equivalent linked-content ref; nothing else
          // about the summary has changed.
          expect(summaries[0]).deep.equal({
            id: 1,
            name: 'My "catch-apple"',
            mtime: 1793704060519,
            summary: 'This project is following the tutorial "catch-apple"',
            linkedContentRef: {
              kind: "flat-tutorial",
              name: "catch-apple",
              interactionState: { chapterIndex: 3 },
            },
          });

          // The "per-method" tutorial project and the unlinked project
          // are untouched.
          expect(summaries[1]).deep.equal(v7SummaryWithId(2));
          expect(summaries[2]).deep.equal(v7SummaryWithId(3));
          expect(summaries).length(3);
        });
      }
    );

    cy.contains("My projects").click();

    cy.pytchOpenProject('My "catch-apple"');
    cy.get(".ProgressTrail .progress-node-background:nth-child(4)").should(
      "have.class",
      "isActive"
    );
    // help-sidebar, tutorial, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar li.ActivityBarTab").should("have.length", 4);

    cy.pytchSwitchProject('My "script-by-script-shoot-the-fruit"');
    cy.get(".Junior-LessonContent");
    // help-sidebar, lesson, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar li.ActivityBarTab").should("have.length", 4);

    cy.pytchSwitchProject("Empty per-method project");
    cy.get(".Junior-LessonContent").should("not.exist");
    // help-sidebar, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar li.ActivityBarTab").should("have.length", 3);
  });
});
