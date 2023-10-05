/// <reference types="cypress" />

context("Management of project assets", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
    cy.contains("Images and sounds").click();
  });

  const initialAssets = ["red-rectangle-80-60.png", "sine-1kHz-2s.mp3"];

  it("shows project assets", () => {
    cy.pytchShouldShowAssets(initialAssets);
  });

  const clickAdd = () => {
    cy.contains("Add to project").should("not.be.disabled").click();
  };

  const attachSamples = (fixtureBasenames: Array<string>) => {
    const filenames = fixtureBasenames.map(
      (basename) => `sample-project-assets/${basename}`
    );
    cy.get('.form-control[type="file"]').attachFile(filenames);
  };

  const addAsset = (fixtureBasename: string) => {
    cy.contains("Add an image").click();
    cy.contains("Add to project").should("be.disabled");
    attachSamples([fixtureBasename]);
    clickAdd();
    cy.get(".modal-content").should("not.exist");
  };

  context("Add image asset, handling errors", () => {
    beforeEach(() => {
      addAsset("green-circle-64.png");
      cy.pytchShouldShowAssets([...initialAssets, "green-circle-64.png"]);
    });

    it("can add another image", () => {
      addAsset("purple-circle-64.png");
      cy.pytchShouldShowAssets([
        ...initialAssets,
        "green-circle-64.png",
        "purple-circle-64.png",
      ]);
    });

    it("can immediately use newly-added image", () => {
      addAsset("purple-circle-64.png");
      cy.pytchBuildCode(`
          import pytch
          class Banana(pytch.Sprite):
            Costumes = ["purple-circle-64.png"]
      `);
      cy.pytchShouldHaveBuiltWithoutErrors();
    });

    it("rejects adding same image twice", () => {
      cy.contains("Add an image").click();
      attachSamples(["green-circle-64.png"]);
      clickAdd();
      cy.contains("Sorry, there was a problem");
      cy.contains("already contains an image or sound");
      cy.get(".modal-header button").click();
    });

    it("rejects unhandled asset mime-type", () => {
      cy.contains("Add an image").click();
      attachSamples(["contains-an-empty-file.zip"]);
      clickAdd();
      cy.contains("Sorry, there was a problem");
      cy.contains("not a valid file type");
      cy.get(".modal-header button").click();
    });

    it("rejects corrupt PNG file", () => {
      cy.contains("Add an image").click();
      attachSamples(["not-really-a-png.png"]);
      clickAdd();
      cy.contains("Sorry, there was a problem");
      cy.contains("problem creating image");
      cy.get(".modal-header button").click();
    });

    it("handles multiple errors", () => {
      cy.contains("Add an image").click();
      attachSamples(["contains-an-empty-file.zip", "green-circle-64.png"]);
      clickAdd();
      cy.contains("Sorry, there was a problem");
      cy.get(".modal-content li").should("have.length", 2);
      cy.contains("not a valid file type");
      cy.contains("already contains an image or sound");
    });
  });

  it("Add two assets at once", () => {
    cy.contains("Add an image").click();
    attachSamples(["green-circle-64.png", "purple-circle-64.png"]);
    clickAdd();
    cy.get(".modal-content").should("not.exist");
    cy.pytchShouldShowAssets([
      ...initialAssets,
      "green-circle-64.png",
      "purple-circle-64.png",
    ]);
  });

  it("Handles mixed success / failure", () => {
    cy.contains("Add an image").click();
    attachSamples([
      "green-circle-64.png",
      "purple-circle-64.png",
      "contains-an-empty-file.zip",
    ]);
    clickAdd();
    cy.contains("Problem adding");
    cy.pytchShouldShowAssets([
      ...initialAssets,
      "green-circle-64.png",
      "purple-circle-64.png",
    ]);
    cy.contains("Sorry, there was a problem");
    cy.contains("not a valid file type");
    cy.get(".modal-header button").click();
    cy.get(".modal-content").should("not.exist");
  });

  const launchDeletion = (assetName: string) => {
    cy.pytchClickAssetDropdownItem(assetName, "DELETE");
  };

  initialAssets.forEach((assetName, assetIndex) => {
    it(`can delete (${assetIndex})th asset`, () => {
      launchDeletion(assetName);
      cy.get("button").contains("DELETE").click();

      const expectedAssets = initialAssets.slice();
      expectedAssets.splice(assetIndex, 1);

      cy.pytchShouldShowAssets(expectedAssets);
    });
  });

  it("makes deleted asset unavailable", () => {
    cy.pytchBuildCode(`
      import pytch
      class Banana(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]
    `);
    cy.pytchShouldHaveBuiltWithoutErrors();
    cy.contains("Images and sounds").click();
    launchDeletion("red-rectangle-80-60.png");
    cy.get("button").contains("DELETE").click();
    cy.pytchGreenFlag();
    cy.pytchShouldShowErrorCard(
      'could not load Image "red-rectangle-80-60.png"',
      "user-space"
    );
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
    it(`can cancel asset deletion (via ${cancelMethod.label})`, () => {
      launchDeletion(initialAssets[0]);
      cancelMethod.invoke();
      cy.pytchShouldShowAssets(initialAssets);
    });
  });

  it("can copy asset name", () => {
    // Actually clicking the Copy name item gives
    // "DOMException: Document is not focused"
    // which seems to be a known problem:
    // https://github.com/cypress-io/cypress/issues/2386
    // Likewise, we can't test the contents of the clipboard,
    // so have to just hope that the actual copying worked.
    //
    cy.pytchActivateAssetDropdown("rectangle");
    cy.contains("Copy name");
  });

  it("can rename assets", () => {
    cy.pytchClickAssetDropdownItem("rectangle", "Rename");
    cy.get("input[type=text]").clear().type("vermillion-rectangle");
    cy.get("button").contains("Rename").click();
    cy.get(".modal-content").should("not.exist");

    cy.pytchClickAssetDropdownItem("sine-1kHz", "Rename");
    cy.get("input[type=text]").clear().type("beep{enter}");
    cy.get(".modal-content").should("not.exist");

    cy.pytchShouldShowAssets(["vermillion-rectangle.png", "beep.mp3"]);
  });

  it("forbids renaming to colliding name", () => {
    addAsset("green-circle-64.png");
    cy.pytchClickAssetDropdownItem("rectangle", "Rename");

    cy.get("input[type=text]").clear().type("green-circle-64");

    cy.get("button").contains("Rename").click();
    cy.contains("already contains");
    cy.get("button").contains("Rename").click();
    cy.contains("already contains");
    cy.get("input[type=text]").clear().type("thing");
    cy.get("button").contains("Rename").click();
    cy.get(".modal-content").should("not.exist");
    cy.pytchShouldShowAssets([
      "thing.png",
      "sine-1kHz-2s.mp3",
      "green-circle-64.png",
    ]);
  });

  it("forbids renaming to empty name", () => {
    cy.pytchClickAssetDropdownItem("rectangle", "Rename");
    cy.get("input[type=text]").clear();
    cy.get("button").contains("Rename").should("be.disabled");
    cy.get("input[type=text]").type("{enter}");
    cy.get("button").contains("Rename").should("be.disabled");
    cy.get("input[type=text]").type("banana.png");
    cy.get("button").contains("Rename").should("not.be.disabled");
  });
});
