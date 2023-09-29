import {
  assertBackdropNames,
  assertCostumeNames,
  assertSoundNames,
  selectActorAspect,
  selectSprite,
  selectStage,
  settleModalDialog,
} from "./utils";

context("Working with assets of an actor", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const clickAddSomething = (match: string) =>
    cy.get("div.tab-pane.active .AddSomethingButton").contains(match).click();

  const addFromMediaLib = (matches: Array<string>) => {
    clickAddSomething("from media library");

    for (const match of matches) {
      // Sometimes the media library is scrolled such that the chosen
      // image is out of view.  Force Cypress to click it:
      cy.get(".clipart-card .clipart-name")
        .contains(match)
        .should("have.length", 1)
        .click({ force: true });
    }

    const expButtonMatch = `Add ${matches.length}`;
    settleModalDialog(expButtonMatch);
  };

  const addFromFixture = (fixtureBasename: string) => {
    clickAddSomething("from this device");

    // TODO: Remove dup with attachSamples() in project-asset-list.cy.ts
    const fixtureFilename = `sample-project-assets/${fixtureBasename}`;
    cy.get('.form-control[type="file"]').attachFile(fixtureFilename);

    settleModalDialog("Add to project");
  };

  const launchDeleteAssetByIndex = (idx: number) => {
    cy.get(".AssetCard").eq(idx).find("button").click();
    cy.get(".dropdown-item").contains("DELETE").click();
    cy.get(".modal-header").contains("Delete image");
  };

  it("can add and delete Costumes from medialib", () => {
    selectSprite("Snake");
    selectActorAspect("Costumes");

    addFromMediaLib(["apple.png"]);
    assertCostumeNames(["python-logo.png", "apple.png"]);

    addFromMediaLib(["orange.png"]);
    assertCostumeNames(["python-logo.png", "apple.png", "orange.png"]);

    launchDeleteAssetByIndex(1);
    settleModalDialog("Cancel");
    assertCostumeNames(["python-logo.png", "apple.png", "orange.png"]);

    launchDeleteAssetByIndex(1);
    settleModalDialog("DELETE");
    assertCostumeNames(["python-logo.png", "orange.png"]);
  });

  it("can delete all Costumes and show help", () => {
    selectSprite("Snake");
    selectActorAspect("Costumes");

    addFromMediaLib(["apple.png", "bowl.png"]);
    assertCostumeNames(["python-logo.png", "apple.png", "bowl.png"]);

    launchDeleteAssetByIndex(1);
    settleModalDialog("DELETE");
    assertCostumeNames(["python-logo.png", "bowl.png"]);

    launchDeleteAssetByIndex(1);
    settleModalDialog("DELETE");
    assertCostumeNames(["python-logo.png"]);

    launchDeleteAssetByIndex(0);
    settleModalDialog("DELETE");
    assertCostumeNames([]);

    cy.get(".NoContentHelp").contains("Your sprite has no costumes");
  });

  it("can delete all but last Backdrop", () => {
    selectStage();
    selectActorAspect("Backdrops");

    // Weird backdrops, but they'll do the job:
    addFromMediaLib(["apple.png", "bowl.png"]);

    launchDeleteAssetByIndex(0);
    settleModalDialog("DELETE");
    assertBackdropNames(["apple.png", "bowl.png"]);

    launchDeleteAssetByIndex(1);
    settleModalDialog("DELETE");
    assertBackdropNames(["apple.png"]);

    cy.get(".AssetCard").should("have.length", 1).find("button").click();
    cy.get(".dropdown-item")
      .contains("DELETE")
      .should("have.class", "disabled");
  });

  it("shows help when no Sounds", () => {
    selectSprite("Snake");
    selectActorAspect("Sounds");
    assertSoundNames("sprite", []);
    cy.get(".NoContentHelp").contains("Your sprite has no sounds");

    selectStage();
    assertSoundNames("stage", []);
    cy.get(".NoContentHelp").contains("Your stage has no sounds");
  });

  it("can upload image and sound assets", () => {
    selectSprite("Snake");

    selectActorAspect("Sounds");
    addFromFixture("silence-500ms.mp3");
    assertSoundNames("sprite", ["silence-500ms.mp3"]);
    addFromFixture("sine-1kHz-2s.mp3");
    assertSoundNames("sprite", ["silence-500ms.mp3", "sine-1kHz-2s.mp3"]);

    const allCostumes = [
      "python-logo.png",
      "green-circle-64.png",
      "purple-circle-64.png",
    ];
    selectActorAspect("Costumes");
    assertCostumeNames(allCostumes.slice(0, 1));
    addFromFixture("green-circle-64.png");
    assertCostumeNames(allCostumes.slice(0, 2));
    addFromFixture("purple-circle-64.png");
    assertCostumeNames(allCostumes);
  });

  it("can rename assets", () => {
    const launchRenameAssetByIndex = (idx: number) => {
      cy.get("div.tab-pane.active .AssetCard").eq(idx).find("button").click();
      cy.get(".dropdown-item").contains("Rename").click();
      cy.get(".modal-header").should("have.length", 1).contains("Rename");
    };

    selectSprite("Snake");
    selectActorAspect("Sounds");
    addFromFixture("silence-500ms.mp3");
    addFromFixture("sine-1kHz-2s.mp3");

    launchRenameAssetByIndex(0);
    cy.get(".CompoundTextInput input").type("{selectAll}{del}hush");
    settleModalDialog("Rename");
    assertSoundNames("sprite", ["hush.mp3", "sine-1kHz-2s.mp3"]);

    selectActorAspect("Costumes");
    addFromMediaLib(["apple.png", "bowl.png"]);

    launchRenameAssetByIndex(1);
    cy.get(".CompoundTextInput input").type("{selectAll}{del}red-apple");
    settleModalDialog("Rename");
    assertCostumeNames(["python-logo.png", "red-apple.png", "bowl.png"]);
  });
});
