context("Upload project from zipfile", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.contains("My projects").click();
  });

  const tryUploadZipfile = (zipBasename: string) => {
    cy.contains("Upload project").click();
    cy.get(".form-control-file").attachFile(`project-zipfiles/${zipBasename}`);
    cy.get(".modal-footer").contains("Upload project").click();
  };

  it("can upload valid zipfile", () => {
    tryUploadZipfile("hello-world.zip");
    // Project creation should have succeeded, meaning we can see this tab:
    cy.contains("Images and sounds");
    cy.pytchCodeTextShouldContain("valid test fixture zipfile");
    // Project should be listed in My Projects:
    cy.contains("MyStuff").click();
    cy.contains("Hello world");
    cy.contains("Created from zipfile");
  });

  [
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
      tryUploadZipfile(spec.zipfile);
      cy.get(".alert").contains(spec.expError);
      cy.get(".modal-footer").contains("Upload project").should("be.disabled");
    });
  });
});
