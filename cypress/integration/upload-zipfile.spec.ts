import { stageHeight, stageWidth } from "../../src/constants";
import { blueColour } from "./crop-scale-constants";

context("Upload project from zipfile", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.contains("My projects").click();
  });

  it("can upload valid v1 zipfile", () => {
    cy.pytchTryUploadZipfiles(["hello-world-format-v1.zip"]);
    // Project creation should have succeeded, meaning we can see this tab:
    cy.contains("Images and sounds");
    cy.pytchCodeTextShouldContain("valid test fixture zipfile");
    // Project should be listed in My Projects:
    cy.pytchHomeFromIDE();
    cy.get(".NavBar").contains("My projects").click();
    cy.contains("Hello world");
    cy.contains("Created from zipfile");
  });

  it("can upload valid v2 zipfile", () => {
    cy.pytchTryUploadZipfiles(["one-cropped-scaled-sprite.zip"]);
    cy.contains("Images and sounds");
    cy.pytchGreenFlag();
    cy.pytchStdoutShouldContain("Hello world");

    // By now the project should have rendered, and every pixel on the
    // stage canvas should be blue.
    cy.pytchCanvasShouldBeSolidColour(blueColour);
  });

  it("can upload valid v3 zipfile", () => {
    cy.pytchTryUploadZipfiles(["print-things.zip"]);
    cy.contains("Images and sounds");
    cy.pytchGreenFlag();
    cy.pytchStdoutShouldContain("One two three");
  });

  it("can upload multiple valid zipfiles", () => {
    cy.pytchTryUploadZipfiles([
      "hello-world-format-v1.zip",
      "hello-again-world.zip",
      "print-things.zip",
    ]);
    // Should have succeeded, but remained on the project list page
    // because more than one zipfile.
    cy.contains("My projects");
    cy.contains("Hello world");
    cy.contains("Hello again world");
    cy.contains("Print some things");
  });

  it("handles mixture of success and failure", () => {
    // Should show the error alert but also have added the valid zipfile
    // as a project.  Should not have navigated to the IDE, because a
    // failure happened.
    cy.pytchTryUploadZipfiles([
      "hello-world-format-v1.zip",
      "no-version-json.zip",
    ]);
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
    {
      zipfile: "corrupt-png-asset.zip",
      expError: "problem creating image",
    },
    {
      zipfile: "v3-no-code-json.zip",
      expError: 'could not find "code/code.json"',
    },
    {
      zipfile: "v3-code-json-not-json.zip",
      expError: "malformed JSON",
    },
    {
      zipfile: "v3-code-json-not-object.zip",
      expError: "invalid JSON",
    },
  ].forEach((spec) => {
    it(`rejects zipfile "${spec.zipfile}"`, () => {
      cy.pytchTryUploadZipfiles([spec.zipfile]);

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
