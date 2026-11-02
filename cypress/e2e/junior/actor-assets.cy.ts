import { ActorKind } from "../../../src/model/junior/structured-program";
import { assertModalWithTitle } from "../utils";
import {
  addFromMediaLib,
  assertBackdropNames,
  assertCostumeNames,
  assertSoundNames,
  clickHeaderCloseButton,
  clickUniqueButton,
  initiateAddFromMediaLib,
  launchAdd,
  launchDeleteAssetByIndex,
  launchRenameAssetByIndex,
  selectActorAspect,
  selectSprite,
  selectStage,
  settleModalDialog,
} from "./utils";

context("Working with assets of an actor", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const attemptAddFromMediaLib = (matches: Array<string>) => {
    initiateAddFromMediaLib(matches);
    const expButtonMatch = `Add ${matches.length}`;
    clickUniqueButton(expButtonMatch);
  };

  const tryAddFromFixture = (
    ownerKindName: string,
    fixtureBasename: string
  ) => {
    launchAdd.assetFromThisDevice([fixtureBasename]);
    clickUniqueButton(`Add to ${ownerKindName}`);
  };

  const addFromFixture = (ownerKindName: string, fixtureBasename: string) => {
    launchAdd.assetFromThisDevice([fixtureBasename]);
    settleModalDialog(`Add to ${ownerKindName}`);
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

  it("forbids adds dup asset from medialib", () => {
    const assertErrorCorrect = (containsMatch: string) => {
      addFromMediaLib(["apple.png"]);
      attemptAddFromMediaLib(["apple.png"]);

      cy.get(".modal.add-asset-failures .modal-body").as("err-msg");
      cy.get("@err-msg").contains("Cannot add “apple.png”");
      cy.get("@err-msg").contains(containsMatch);
    };

    selectSprite("Snake");
    selectActorAspect("Costumes");
    assertErrorCorrect("already has a costume");
    settleModalDialog("OK");

    selectStage();
    selectActorAspect("Backdrops");
    assertErrorCorrect("already has a backdrop");
    settleModalDialog("OK");
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

    launchDeleteAssetByIndex(0, "backdrop");
    settleModalDialog("DELETE");
    assertBackdropNames(["apple.png", "bowl.png"]);

    launchDeleteAssetByIndex(1, "backdrop");
    settleModalDialog("DELETE");
    assertBackdropNames(["apple.png"]);

    cy.get(".AssetCard").should("have.length", 1).find(".dropdown").click();
    cy.get(".dropdown-item")
      .contains("DELETE")
      .should("have.attr", "aria-disabled", "true");
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
    addFromFixture("sprite", "silence-500ms.mp3");
    assertSoundNames("sprite", ["silence-500ms.mp3"]);
    addFromFixture("sprite", "sine-1kHz-2s.mp3");
    assertSoundNames("sprite", ["silence-500ms.mp3", "sine-1kHz-2s.mp3"]);

    const allCostumes = [
      "python-logo.png",
      "green-circle-64.png",
      "purple-circle-64.png",
    ];
    selectActorAspect("Costumes");
    assertCostumeNames(allCostumes.slice(0, 1));
    addFromFixture("sprite", "green-circle-64.png");
    assertCostumeNames(allCostumes.slice(0, 2));
    addFromFixture("sprite", "purple-circle-64.png");
    assertCostumeNames(allCostumes);
  });

  it("asset with uppercase filename", () => {
    const assetFilename = "RECTANGLE-RED-80-60.PNG";

    selectSprite("Snake");
    selectActorAspect("Costumes");
    addFromFixture("sprite", assetFilename);
    assertCostumeNames(["python-logo.png", assetFilename]);
  });

  it("has useful UI text for uploading", () => {
    const assertContentCorrect = (headerMatch: string, bodyMatch: string) => {
      launchAdd.assetFromThisDevice();
      assertModalWithTitle(headerMatch);
      cy.get(".modal-body").contains(bodyMatch);
      settleModalDialog("Cancel");
    };

    selectStage();
    selectActorAspect("Backdrops");
    assertContentCorrect("Add image/s", "Choose an image or some images");
    selectActorAspect("Sounds");
    assertContentCorrect("Add sound/s", "Choose a sound or some sounds");

    selectSprite("Snake");
    selectActorAspect("Costumes");
    assertContentCorrect("Add image/s", "Choose an image or some images");
    selectActorAspect("Sounds");
    assertContentCorrect("Add sound/s", "Choose a sound or some sounds");
  });

  it("forbids adding duplicate assets", () => {
    const assertErrorCorrect = (actorKind: ActorKind, targetMatch: string) => {
      selectActorAspect("Sounds");

      // In English, actorKind (the string literal) happens to match the
      // display name for owner kind.
      addFromFixture(actorKind, "silence-500ms.mp3");

      tryAddFromFixture(actorKind, "silence-500ms.mp3");

      cy.get(".add-asset-failures .modal-body").as("err-msg");
      cy.get("@err-msg").contains("Cannot add “silence-500ms.mp3”");
      cy.get("@err-msg").contains(targetMatch);

      settleModalDialog(clickHeaderCloseButton);

      assertSoundNames(actorKind, ["silence-500ms.mp3"]);
    };

    selectSprite("Snake");
    assertErrorCorrect("sprite", "to this sprite");

    selectStage();
    assertErrorCorrect("stage", "to the stage");
  });

  const addSampleSounds = (kindDisplayName: string) => {
    selectActorAspect("Sounds");
    addFromFixture(kindDisplayName, "silence-500ms.mp3");
    addFromFixture(kindDisplayName, "sine-1kHz-2s.mp3");
  };

  it("can rename assets", () => {
    selectSprite("Snake");
    addSampleSounds("sprite");

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
      // In English, actorKind === displayName
      addSampleSounds(actorKind);

      launchRenameAssetByIndex(0);
      cy.get(".CompoundTextInput input").type("{selectAll}{del}sine-1kHz-2s");
      clickUniqueButton("Rename");

      cy.get(".modal.RenameAssetModal-failure .modal-body p").as("err-msg");
      cy.get("@err-msg").contains("Cannot rename sound “silence-500ms.mp3”");
      cy.get("@err-msg").contains("to “sine-1kHz-2s.mp3”");
      cy.get("@err-msg").contains(containsMatch);
      cy.get("@err-msg").contains("a sound with that name");

      settleModalDialog("OK");

      assertSoundNames(actorKind, ["silence-500ms.mp3", "sine-1kHz-2s.mp3"]);
    };

    selectSprite("Snake");
    assertErrorCorrect("sprite", "this sprite already has");

    selectStage();
    assertErrorCorrect("stage", "the stage already has");
  });
});
