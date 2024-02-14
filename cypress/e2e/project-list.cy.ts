/// <reference types="cypress" />

import { DexieStorage } from "../../src/database/indexed-db";
import { WhetherExampleTag } from "../../src/model/project-templates";
import { hexSHA256 } from "../../src/utils";
import { launchDropdownAction } from "./utils";

context("Management of project list", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.contains("My projects").click();
    cy.location("pathname").should("include", "projects");
  });

  it("can create project and get its content-hash", () => {
    cy.get("button").contains("Create new").click();
    cy.get("button").contains("Without example code").click();
    cy.get("button").contains("as one big program").click();
    cy.get("button").contains("Create project").click();
    cy.contains("Project created").should("not.exist");
    cy.get(".StageWithControls");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    cy.pytchHomeFromIDE();
    cy.get(".NavBar").contains("My projects").click();
    cy.get(".ProjectCard").contains("Untitled").click();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then(async (window: any) => {
      const db = window.PYTCH_CYPRESS.PYTCH_DB as DexieStorage;
      cy.get("[data-project-id]")
        .invoke("attr", "data-project-id")
        .then(async (idStr: string) => {
          const projectId = parseInt(idStr);
          const gotHash = await db.projectContentHash(projectId);

          // $ echo "import pytch" | sha256sum
          const expProgramLine =
            "program=flat/" +
            "272b26e4f3edbdf5586bae5d83fe9d24b93a8df77c60c774a82f963dbcff61b8" +
            "\n";

          // TODO: Remove duplication with same code in zipfile.spec.ts.
          const expAssetsLine =
            "assets=" +
            // $ echo -n "python-logo.png" | sha256sum
            "8c87ba2e4389ff14df72279d83cd4122b9a8609ec0f5a8004bd64ae81771f254" +
            // $ echo -n "image/png" | sha256sum
            "/96485abcb6721ebe4bf572c89357ab84ced0a346ef7ab2296a94b5509d9b01bd" +
            // $ sha256sum public/assets/python-logo.png
            "/ecfec4ebe46f392e6524d1706ec0ad8b30a43bc9464c1b2c214983f9c23f8f37" +
            // $ echo -n "ImageTransform/0e+0/0e+0/1e+0/1e+0/1e+0" | sha256sum
            "/fa7ad7ba6a92c08d550156fda2ab448e77d62428751f5ac033c3ffa1476cbd28" +
            "\n";

          const expFingerprint = expProgramLine + expAssetsLine;
          const expHash = await hexSHA256(expFingerprint);
          expect(gotHash).eq(expHash);
        });
    });
  });

  const createProject = (
    name: string,
    whetherExample: WhetherExampleTag,
    invocation: "button" | "enter"
  ) => {
    cy.get("button").contains("Create new").click();
    cy.get("input[type=text]").clear().type(name);

    // We get away with using the same data attribute for both
    // components because the two types don't overlap:
    cy.get(`button[data-option-slug=${whetherExample}]`).click();
    cy.get(`button[data-option-slug=flat]`).click();

    if (invocation === "button") {
      cy.get("button").contains("Create project").click();
    } else {
      cy.get("input[type=text]").type("{enter}");
    }
    cy.contains("Project created").should("not.exist");
    cy.pytchHomeFromIDE();
    cy.get(".NavBar").contains("My projects").click();
    cy.get(".ProjectCard").contains(name);
  };

  it("can create a project from the skeleton", () => {
    createProject("Bananas", "with-example", "button");
    cy.pytchProjectNamesShouldDeepEqual(["Bananas", "Test seed project"]);
    cy.pytchOpenProject("Bananas");
    cy.pytchCodeTextShouldContain("change or delete anything");
    cy.pytchShouldShowAssets(["green-burst.jpg", "python-logo.png"]);
    cy.pytchBuild();
    cy.pytchShouldHaveBuiltWithoutErrors();
  });

  it("can create a bare-bones project", () => {
    createProject("Bananas", "without-example", "button");
    cy.pytchProjectNamesShouldDeepEqual(["Bananas", "Test seed project"]);
    cy.pytchOpenProject("Bananas");
    cy.pytchCodeTextShouldEqual("import pytch\n");
    cy.pytchShouldShowAssets(["python-logo.png"]);
    cy.pytchBuild();
    cy.pytchShouldHaveBuiltWithoutErrors();
  });

  it("can create multiple projects", () => {
    createProject("Bananas", "without-example", "button");
    createProject("Space Invaders", "without-example", "enter");
    cy.pytchProjectNamesShouldDeepEqual([
      "Space Invaders",
      "Bananas",
      "Test seed project",
    ]);
  });

  [
    {
      label: "Save button",
      action: () => cy.get("button").contains("Save").click(),
    },
    {
      label: "green flag",
      action: () => cy.get(".GreenFlag").click(),
    },
  ].forEach((spec) => {
    it(`can save and re-open projects (via ${spec.label})`, () => {
      createProject("Pac-Person", "without-example", "button");
      cy.pytchOpenProject("Pac-Person");
      // Erase the skeleton project text before typing our marker.
      cy.get("#pytch-ace-editor").type(
        "{selectall}{backspace}import pytch\n\n# HELLO PAC-PERSON{enter}"
      );
      spec.action();
      cy.pytchSwitchProject("Pac-Person");
      cy.pytchCodeTextShouldContain("HELLO PAC-PERSON");

      cy.pytchSwitchProject("Test seed");
      // The seed project does not have the skeleton project text.
      cy.get("#pytch-ace-editor").type("# HELLO SEED PROJECT{enter}");
      spec.action();

      cy.pytchSwitchProject("Pac-Person");
      cy.pytchCodeTextShouldContain("HELLO PAC-PERSON");

      cy.pytchSwitchProject("Test seed");
      cy.pytchCodeTextShouldContain("HELLO SEED PROJECT");
    });
  });

  it("handles open of non-existent project", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then((window: any) => {
      const badId = window.PYTCH_CYPRESS.nonExistentProjectId;
      cy.visit(`/ide/${badId}`);
      cy.contains("Sorry, there was a problem");
      cy.title().should("eq", "Pytch: Problem loading project");
      cy.contains("Return to").click();
      cy.contains("My projects");
      cy.contains("Test seed");
    });
  });

  // For "out-of-range", generate a string of decimals which will parse
  // to an "unsafe integer", i.e., one which can't be stored exactly.
  [
    { label: "non-numeric", idString: "not-a-valid-id" },
    { label: "out-of-range", idString: `${Number.MAX_SAFE_INTEGER}1` },
  ].forEach((spec) => {
    it(`handles malformed project-id (${spec.label})`, () => {
      cy.visit(`/ide/${spec.idString}`);
      cy.contains("Sorry, there was a problem");
      cy.title().should("eq", "Pytch: Problem loading project");
      cy.contains("Return to").click();
      cy.contains("My projects");
      cy.contains("Test seed");
    });
  });

  it("can rename project", () => {
    createProject("Bananas", "without-example", "button");
    cy.pytchProjectNamesShouldDeepEqual(["Bananas", "Test seed project"]);
    launchDropdownAction("Bananas", "Rename");
    cy.get("input").as("textField").clear().type("Oranges{enter}");
    cy.get("@textField").should("not.exist");
    cy.pytchProjectNamesShouldDeepEqual(["Oranges", "Test seed project"]);
  });

  const launchDeletion = (projectName: string) => {
    launchDropdownAction(projectName, "DELETE");
  };

  it("can delete a project", () => {
    createProject("Apples", "without-example", "enter");
    createProject("Bananas", "without-example", "button");
    cy.pytchProjectNamesShouldDeepEqual([
      "Bananas",
      "Apples",
      "Test seed project",
    ]);
    launchDeletion("Apples");
    cy.contains("Are you sure");
    cy.get("button").contains("DELETE").click();
    cy.pytchProjectNamesShouldDeepEqual(["Bananas", "Test seed project"]);
  });

  [
    {
      label: "escape key",
      invoke: () => cy.contains("Are you sure").type("{esc}"),
    },
    {
      label: "cancel button",
      invoke: () => cy.get("button").contains("Cancel").click(),
    },
  ].forEach((cancelMethod) => {
    it(`can cancel project deletion (via ${cancelMethod.label})`, () => {
      createProject("Apples", "without-example", "button");
      createProject("Bananas", "without-example", "enter");

      launchDeletion("Apples");
      cancelMethod.invoke();
      cy.contains("Are you sure").should("not.exist");
      cy.pytchProjectNamesShouldDeepEqual([
        "Bananas",
        "Apples",
        "Test seed project",
      ]);
    });
  });
});

context("Sorting by mtime", () => {
  it("presents project in correct order", () => {
    const extraProjectNames = [
      "Apples",
      "Bananas",
      "Raspberries",
      "Strawberries",
    ];

    let expProjectNames = ["Test seed project", ...extraProjectNames];
    expProjectNames.reverse();

    function moveProjectToFront(name: string) {
      const idx = expProjectNames.indexOf(name);
      expProjectNames.splice(idx, 1);
      expProjectNames.unshift(name);
    }

    cy.pytchResetDatabase({ extraProjectNames });
    cy.contains("My projects").click();

    // We have to keep making a copy of expProjectNames because we're
    // mutating it as we go along.  Also below in loop.
    cy.pytchProjectNamesShouldDeepEqual(expProjectNames.slice());

    for (const name of ["Bananas", "Apples", "Bananas", "Strawberries"]) {
      cy.get("div.ProjectCard").contains(name).click();
      moveProjectToFront(name);
      cy.get("button.save-button").click();
      cy.pytchHomeFromIDE();

      cy.contains("My projects").click();
      cy.pytchProjectNamesShouldDeepEqual(expProjectNames.slice());
    }
  });
});
