/// <reference types="cypress" />

import { launchAdd } from "./junior/utils";
import { kExpNTutorials } from "./utils";

context("can filter media library by tags", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  beforeEach(launchAdd.assetFromMediaLibrary);

  afterEach(() => {
    cy.get("button").contains("Cancel").click();
  });

  type IsActive = "active" | "inactive";

  const getButtons = (isActive: IsActive, variant: string) => {
    const clsFragment = isActive === "active" ? "" : "outline-";
    const cls = `btn-${clsFragment}${variant}`;
    return cy.get(`.ClipArtTagButtonCollection li button.${cls}`);
  };

  const getAllButton = (isActive: IsActive) => getButtons(isActive, "success");

  const getAllNamedTagButtons = (isActive: IsActive) =>
    getButtons(isActive, "primary");

  const getNamedTagButton = (tagMatch: string, isActive: IsActive) =>
    getAllNamedTagButtons(isActive).contains(tagMatch);

  const clickNamedTagButton = (
    tagMatch: string,
    clickOptions?: Partial<Cypress.ClickOptions>
  ) => {
    cy.get(".ClipArtTagButtonCollection li button")
      .contains(tagMatch)
      .click(clickOptions);
  };

  const expectNEntries = (expNEntries: number) => {
    cy.get(".clipart-card").should("have.length", expNEntries);
  };

  const expectButtonStates = (
    expNActive: number,
    expNInactive: number,
    expAllIsActive: IsActive
  ) => {
    getAllButton(expAllIsActive);
    getAllNamedTagButtons("active").should("have.length", expNActive);
    getAllNamedTagButtons("inactive").should("have.length", expNInactive);
  };

  it("starts with all selected", () => {
    expectButtonStates(0, kExpNTutorials, "active");
  });

  it("can choose single tags", () => {
    clickNamedTagButton("Chase!");
    expectButtonStates(1, kExpNTutorials - 1, "inactive");
    getNamedTagButton("Chase!", "active");
    expectNEntries(3);

    clickNamedTagButton("Bunner");
    expectButtonStates(1, kExpNTutorials - 1, "inactive");
    getNamedTagButton("Bunner", "active");
    expectNEntries(8);
  });

  it("can choose multiple tags", () => {
    clickNamedTagButton("Chase!");
    clickNamedTagButton("Bunner", { controlKey: true });
    expectButtonStates(2, kExpNTutorials - 2, "inactive");
    getNamedTagButton("Chase!", "active");
    getNamedTagButton("Bunner", "active");
    expectNEntries(11);
  });
});

context("Add clipart from library, handling errors", () => {
  const clickAddN = (expAddN: number) => {
    const expLabel = `Add ${expAddN} to project`;
    cy.get("button").contains(expLabel).click();
  };

  const launchChooseClipArt = () => {
    launchAdd.assetFromMediaLibrary();
    cy.contains("Add to project").should("be.disabled");
  };

  const attemptChooseClipArt = (
    clipArtNames: Array<string>,
    expAddN: number
  ) => {
    launchChooseClipArt();
    clipArtNames.forEach((clipArtName) =>
      cy.get(".clipart-card").contains(clipArtName).click()
    );
    clickAddN(expAddN);
  };

  const chooseClipArt = (clipArtNames: Array<string>, expAddN: number) => {
    attemptChooseClipArt(clipArtNames, expAddN);
    cy.get(".modal-content").should("not.exist");
  };

  const startTestAssets = [
    "red-rectangle-80-60.png",
    "sine-1kHz-2s.mp3",
    "apple.png",
  ];

  beforeEach(() => {
    cy.pytchExactlyOneProject();
    cy.contains("Images and sounds").click();
    chooseClipArt(["apple.png"], 1);
    cy.pytchShouldShowAssets(startTestAssets);
  });

  it("can dismiss with keyboard", () => {
    launchChooseClipArt();
    cy.get(".modal").type("{esc}");
    cy.get(".modal").should("not.exist");
  });

  it("can add a single-item entry", () => {
    chooseClipArt(["bird.png"], 1);
    cy.pytchShouldShowAssets([...startTestAssets, "bird.png"]);
  });

  it("can add a multi-item entry", () => {
    chooseClipArt(["blocks"], 2);
    cy.pytchShouldShowAssets([
      ...startTestAssets,
      "block-lit.png",
      "block-unlit.png",
    ]);
  });

  it("can scroll through the gallery to find clipart", () => {
    chooseClipArt(["world.png"], 1);
    cy.pytchShouldShowAssets([...startTestAssets, "world.png"]);
  });

  const assertErrorContains = (content: string) => {
    cy.get(".modal.add-asset-failures .modal-body").contains(content);
  };

  it("rejects adding same clipart twice", () => {
    attemptChooseClipArt(["apple.png"], 1);

    assertErrorContains("Sorry, there was a problem adding files");
    assertErrorContains('Cannot add "apple.png" to your project');
    assertErrorContains("it already contains an image or sound of that name");

    cy.get("button").contains("OK").click();
    cy.pytchShouldShowAssets(startTestAssets);
  });

  it("handles one failure and one success", () => {
    attemptChooseClipArt(["apple.png", "orange.png"], 2);

    assertErrorContains("Sorry, there was a problem adding files");
    assertErrorContains('Cannot add "apple.png" to your project');
    assertErrorContains("it already contains an image or sound of that name");

    // TODO: Test for toast.

    cy.contains("OK").click();
    cy.pytchShouldShowAssets([...startTestAssets, "orange.png"]);
  });

  it("handles two failures and one success", () => {
    chooseClipArt(["orange.png"], 1);
    attemptChooseClipArt(["orange.png", "apple.png", "bird.png"], 3);

    assertErrorContains("Sorry, there was a problem adding files");
    assertErrorContains('Cannot add "apple.png" to your project');
    assertErrorContains('Cannot add "orange.png" to your project');
    assertErrorContains("it already contains an image or sound of that name");

    // TODO: Test for toast.

    cy.contains("OK").click();
    cy.pytchShouldShowAssets([...startTestAssets, "orange.png", "bird.png"]);
  });

  it("handles one failure and two successes", () => {
    attemptChooseClipArt(["apple.png", "orange.png", "bird.png"], 3);

    assertErrorContains("Sorry, there was a problem adding files");
    assertErrorContains('Cannot add "apple.png" to your project');
    assertErrorContains("it already contains an image or sound of that name");

    // TODO: Test for toast.

    cy.contains("OK").click();
    cy.pytchShouldShowAssets([...startTestAssets, "orange.png", "bird.png"]);
  });
});
