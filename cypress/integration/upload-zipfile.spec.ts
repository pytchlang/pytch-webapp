context("Upload project from zipfile", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.contains("My projects").click();
  });

  const tryUploadZipfiles = (zipBasenames: Array<string>) => {
    cy.contains("Upload project").click();
    for (const zipBasename of zipBasenames) {
      cy.get(".form-control-file").attachFile(
        `project-zipfiles/${zipBasename}`
      );
    }
    cy.get(".modal-footer").contains("Upload").click();
    cy.get(".modal-footer").should("not.exist");
  };

  it("can upload valid zipfile", () => {
    tryUploadZipfiles(["hello-world.zip"]);
    // Project creation should have succeeded, meaning we can see this tab:
    cy.contains("Images and sounds");
    cy.pytchCodeTextShouldContain("valid test fixture zipfile");
    // Project should be listed in My Projects:
    cy.contains("MyStuff").click();
    cy.contains("Hello world");
    cy.contains("Created from zipfile");
  });

  it("can upload multiple valid zipfiles", () => {
    tryUploadZipfiles(["hello-world.zip", "hello-again-world.zip"]);
    // Should have succeeded, but remained on the project list page
    // because more than one zipfile.
    cy.contains("My projects");
    cy.contains("Hello world");
    cy.contains("Hello again world");
  });

  it("handles mixture of success and failure", () => {
    // Should show the error alert but also have added the valid zipfile
    // as a project.  Should not have navigated to the IDE, because a
    // failure happened.
    tryUploadZipfiles(["hello-world.zip", "no-version-json.zip"]);
    cy.get(".modal-body").contains("There was a problem");
    cy.get("button.close").click();
    cy.contains("My projects");
    cy.contains("Hello world");
  });

  [
    {
      zipfile: "not-even-a-zipfile.zip",
      expError: "does not seem to be a zipfile",
    },
    {
      zipfile: "no-version-json.zip",
      expError: 'could not find "version',
    },
    {
      zipfile: "version-json-is-not-json.zip",
      expError: 'could not parse contents of "version',
    },
    {
      zipfile: "version-json-lacks-correct-property.zip",
      expError: "does not contain pytchZipfileVersion",
    },
    {
      zipfile: "version-json-has-unsupported-version.zip",
      expError: "unhandled Pytch zipfile version",
    },
    {
      zipfile: "no-meta-json.zip",
      expError: 'could not find "meta',
    },
    {
      zipfile: "meta-json-is-not-json.zip",
      expError: 'could not parse contents of "meta',
    },
    {
      zipfile: "meta-json-lacks-correct-property.zip",
      expError: "could not find project name",
    },
    {
      zipfile: "meta-json-has-non-string-project-name.zip",
      expError: "project name is not a string",
    },
    {
      zipfile: "asset-of-unknown-mime-type.zip",
      expError: "could not determine mime-type",
    },
  ].forEach((spec) => {
    it(`rejects zipfile "${spec.zipfile}"`, () => {
      tryUploadZipfiles([spec.zipfile]);

      // Check we get wrapped (but not double-wrapped) errors:
      cy.get(".modal-body").should(($div) => {
        const text = $div.text();
        expect(text).to.contain("There was a problem");
        expect(text).to.not.match(/Technical details.*Technical details/);
      });

      cy.get(".modal-body").contains(spec.expError);
      cy.get("button.close").click();
    });
  });
});
