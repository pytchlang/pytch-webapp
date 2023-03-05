/// <reference types="cypress" />

context("can filter media library by tags", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  beforeEach(() => {
    cy.get("button").contains("Choose from library").click();
  });

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
    expectButtonStates(0, 11, "active");
  });
});

context("Add clipart from library, handling errors", () => {
  const clickAddN = (expAddN: number) => {
    const expLabel = `Add ${expAddN} to project`;
    cy.get("button").contains(expLabel).click();
  };

  const attemptChooseClipArt = (
    clipArtNames: Array<string>,
    expAddN: number
  ) => {
    cy.contains("Choose from library").click();
    cy.contains("Add to project").should("be.disabled");
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

  it("rejects adding same clipart twice", () => {
    attemptChooseClipArt(["apple.png"], 1);
    cy.contains(
      "oh, no! The selected clipart can not be added" +
        ' (apple.png: Your project already contains an asset called "apple.png".)' +
        " Please modify your selection."
    );
    cy.contains("Cancel").click();
    cy.pytchShouldShowAssets(startTestAssets);
  });

  it("handles one failure and one success", () => {
    attemptChooseClipArt(["apple.png", "orange.png"], 2);
    cy.contains(
      "1 clipart successfully added, but not the other" +
        ' (apple.png: Your project already contains an asset called "apple.png".)' +
        " Please modify your selection."
    );
    cy.contains("Cancel").click();
    cy.pytchShouldShowAssets([...startTestAssets, "orange.png"]);
  });

  it("handles two failures and one success", () => {
    chooseClipArt(["orange.png"], 1);
    attemptChooseClipArt(["orange.png", "apple.png", "bird.png"], 3);
    cy.contains(
      "1 clipart successfully added, but not the 2 others" +
        ' (apple.png: Your project already contains an asset called "apple.png".' +
        ' orange.png: Your project already contains an asset called "orange.png". )' +
        " Please modify your selection."
    );
    cy.contains("Cancel").click();
    cy.pytchShouldShowAssets([...startTestAssets, "orange.png", "bird.png"]);
  });

  it("handles one failure and two successes", () => {
    attemptChooseClipArt(["apple.png", "orange.png", "bird.png"], 3);
    cy.contains(
      "2 cliparts successfully added, but 1 problem encontered" +
        ' (apple.png: Your project already contains an asset called "apple.png".)' +
        " Please modify your selection."
    );
    cy.contains("Cancel").click();
    cy.pytchShouldShowAssets([...startTestAssets, "orange.png", "bird.png"]);
  });
});
