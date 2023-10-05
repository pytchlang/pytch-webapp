import { ActorKind } from "../../../src/model/junior/structured-program";
import {
  assertBackdropNames,
  assertCostumeNames,
  assertSoundNames,
  clickHeaderCloseButton,
  clickUniqueButton,
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

  const initiateAddFromFixture = (fixtureBasename: string) => {
    clickAddSomething("from this device");

    // TODO: Remove dup with attachSamples() in project-asset-list.cy.ts
    const fixtureFilename = `sample-project-assets/${fixtureBasename}`;
    cy.get('.form-control[type="file"]').attachFile(fixtureFilename);
  };

  const tryAddFromFixture = (fixtureBasename: string) => {
    initiateAddFromFixture(fixtureBasename);
    clickUniqueButton("Add to project");
  };

  const addFromFixture = (fixtureBasename: string) => {
    initiateAddFromFixture(fixtureBasename);
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

  it("has useful UI text for uploading", () => {
    const assertContentCorrect = (headerMatch: string, bodyMatch: string) => {
      clickAddSomething("from this device");
      cy.get(".modal-header").contains(headerMatch);
      cy.get(".modal-body").contains(bodyMatch);
      settleModalDialog("Cancel");
    };

    selectStage();
    selectActorAspect("Backdrops");
    assertContentCorrect("Add Backdrops", "Choose Backdrops");
    selectActorAspect("Sounds");
    assertContentCorrect("Add Sounds", "Choose Sounds");

    selectSprite("Snake");
    selectActorAspect("Costumes");
    assertContentCorrect("Add Costumes", "Choose Costumes");
    selectActorAspect("Sounds");
    assertContentCorrect("Add Sounds", "Choose Sounds");
  });

  it("forbids adding duplicate assets", () => {
    const assertErrorCorrect = (actorKind: ActorKind, targetMatch: string) => {
      selectActorAspect("Sounds");
      addFromFixture("silence-500ms.mp3");
      tryAddFromFixture("silence-500ms.mp3");

      cy.get(".add-asset-failures .modal-body").as("err-msg");
      cy.get("@err-msg").contains('Cannot add "silence-500ms.mp3"');
      cy.get("@err-msg").contains(targetMatch);

      settleModalDialog(clickHeaderCloseButton);

      assertSoundNames(actorKind, ["silence-500ms.mp3"]);
    };

    selectSprite("Snake");
    assertErrorCorrect("sprite", "to this sprite");

    selectStage();
    assertErrorCorrect("stage", "to the stage");
  });

  const launchRenameAssetByIndex = (idx: number) => {
    cy.get("div.tab-pane.active .AssetCard").eq(idx).find("button").click();
    cy.get(".dropdown-item").contains("Rename").click();
    cy.get(".modal-header").should("have.length", 1).contains("Rename");
  };

  const addSampleSounds = () => {
    selectActorAspect("Sounds");
    addFromFixture("silence-500ms.mp3");
    addFromFixture("sine-1kHz-2s.mp3");
  };

  it("can rename assets", () => {
    selectSprite("Snake");
    addSampleSounds();

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

  it("forbids rename to colliding name", () => {
    const assertErrorCorrect = (
      actorKind: ActorKind,
      containsMatch: string
    ) => {
      addSampleSounds();

      launchRenameAssetByIndex(0);
      cy.get(".CompoundTextInput input").type("{selectAll}{del}sine-1kHz-2s");
      clickUniqueButton("Rename");

      cy.get(".alert-danger").as("err-msg");
      cy.get("@err-msg").contains('Cannot rename "silence-500ms.mp3"');
      cy.get("@err-msg").contains(containsMatch);
      cy.get("@err-msg").contains('a Sound called "sine-1kHz-2s.mp3"');

      settleModalDialog("Cancel");

      assertSoundNames(actorKind, ["silence-500ms.mp3", "sine-1kHz-2s.mp3"]);
    };

    selectSprite("Snake");
    assertErrorCorrect("sprite", "this sprite already contains");

    selectStage();
    assertErrorCorrect("stage", "the stage already contains");
  });
});
