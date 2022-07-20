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
  const attachSample = (fixtureBasename: string) => {
    cy.get(".form-control-file").attachFile(
      `sample-project-assets/${fixtureBasename}`
    );
  };

  context("Add image asset, handling errors", () => {
    const addAsset = (fixtureBasename: string) => {
      cy.contains("Add an image").click();
      cy.contains("Add to project").should("be.disabled");
      attachSample(fixtureBasename);
      clickAdd();
      cy.get(".modal-content").should("not.exist");
    };

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
      attachSample("green-circle-64.png");
      clickAdd();
      cy.contains("Sorry, there was a problem");
      cy.contains("already contains an asset");
      cy.get(".modal-header button").click();
    });

    it("rejects unhandled asset mime-type", () => {
      cy.contains("Add an image").click();
      attachSample("contains-an-empty-file.zip");
      clickAdd();
      cy.contains("Sorry, there was a problem");
      cy.contains("not a valid file type");
      cy.get(".modal-header button").click();
    });

    it("handles multiple errors", () => {
      cy.contains("Add an image").click();
      attachSample("contains-an-empty-file.zip");
      attachSample("green-circle-64.png");
      clickAdd();
      cy.contains("Sorry, there was a problem");
      cy.get(".modal-content li").should("have.length", 2);
      cy.contains("not a valid file type");
      cy.contains("already contains an asset");
    });
  });

  it("Add two assets at once", () => {
    cy.contains("Add an image").click();
    attachSample("green-circle-64.png");
    attachSample("purple-circle-64.png");
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
    attachSample("green-circle-64.png");
    attachSample("purple-circle-64.png");
    attachSample("contains-an-empty-file.zip");
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

  const activateAssetDropdown = (
    assetName: string,
    maybeChooseItem = () => {}
  ) => {
    cy.get(".card-header")
      .contains(assetName)
      .parent()
      .within(() => {
        cy.get(".dropdown").click();
        maybeChooseItem();
      });
  };

  const clickAssetDropdownItem = (assetName: string, itemName: string) => {
    activateAssetDropdown(assetName, () => cy.contains(itemName).click());
  };

  const launchDeletion = (assetName: string) => {
    clickAssetDropdownItem(assetName, "DELETE");
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
    activateAssetDropdown("rectangle");
    cy.contains("Copy name");
  });

  it("can rename assets", () => {
    clickAssetDropdownItem("rectangle", "Rename");
    cy.get("input[type=text]").clear().type("vermillion-rectangle.png");
    cy.get("button").contains("Rename").click();
    cy.get(".modal-content").should("not.exist");

    clickAssetDropdownItem("sine-1kHz", "Rename");
    cy.get("input[type=text]").clear().type("beep.mp3{enter}");
    cy.get(".modal-content").should("not.exist");

    cy.pytchShouldShowAssets(["vermillion-rectangle.png", "beep.mp3"]);
  });

  it("forbids renaming to colliding name", () => {
    clickAssetDropdownItem("rectangle", "Rename");

    // You'd never rename a PNG to an MP3 but never mind.
    cy.get("input[type=text]").clear().type("sine-1kHz-2s.mp3");

    cy.get("button").contains("Rename").click();
    cy.contains("already contains");
    cy.get("button").contains("Rename").click();
    cy.contains("already contains");
    cy.get("input[type=text]").clear().type("thing.png");
    cy.get("button").contains("Rename").click();
    cy.get(".modal-content").should("not.exist");
    cy.pytchShouldShowAssets(["thing.png", "sine-1kHz-2s.mp3"]);
  });

  it("forbids renaming to empty name", () => {
    clickAssetDropdownItem("rectangle", "Rename");
    cy.get("input[type=text]").clear();
    cy.get("button").contains("Rename").should("be.disabled");
    cy.get("input[type=text]").type("{enter}");
    cy.get("button").contains("Rename").should("be.disabled");
    cy.get("input[type=text]").type("banana.png");
    cy.get("button").contains("Rename").should("not.be.disabled");
  });
    it("can add a clipart", () => {
      chooseClipArt("angel");
      cy.pytchShouldShowAssets([...initialAssets, "alien.png", "angel.png"]);
    });
});
