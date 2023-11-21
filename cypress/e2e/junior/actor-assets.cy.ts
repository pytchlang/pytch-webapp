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

  const initiateAddFromMediaLib = (matches: Array<string>) => {
    clickAddSomething("from media library");

    for (const match of matches) {
      // Sometimes the media library is scrolled such that the chosen
      // image is out of view.  Force Cypress to click it:
      cy.get(".clipart-card .clipart-name")
        .contains(match)
        .should("have.length", 1)
        .click({ force: true });
    }
  };

  const attemptAddFromMediaLib = (matches: Array<string>) => {
    initiateAddFromMediaLib(matches);
    const expButtonMatch = `Add ${matches.length}`;
    clickUniqueButton(expButtonMatch);
  };

  const addFromMediaLib = (matches: Array<string>) => {
    initiateAddFromMediaLib(matches);
    const expButtonMatch = `Add ${matches.length}`;
    settleModalDialog(expButtonMatch);
  };

  const addAllFromMediaLibEntry = (entry: string, expNItems: number) => {
    initiateAddFromMediaLib([entry]);
    const expButtonMatch = `Add ${expNItems}`;
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

  it("forbids adds dup asset from medialib", () => {
    const assertErrorCorrect = (containsMatch: string) => {
      addFromMediaLib(["apple.png"]);
      attemptAddFromMediaLib(["apple.png"]);

      cy.get(".modal-body .alert-danger").as("err-msg");
      cy.get("@err-msg").contains('Cannot add "apple.png"');
      cy.get("@err-msg").contains(containsMatch);
    };

    selectSprite("Snake");
    selectActorAspect("Costumes");
    assertErrorCorrect("already contains a Costume");
    settleModalDialog("Cancel");

    selectStage();
    selectActorAspect("Backdrops");
    assertErrorCorrect("already contains a Backdrop");
    settleModalDialog("Cancel");
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

  it("allows drag/drop reordering of costumes", () => {
    const originalOrder = [
      /* 0 */ "python-logo.png",
      /* 1 */ "apple.png",
      /* 2 */ "ball.png",
      /* 3 */ "bird.png",
      /* 4 */ "bowl.png",
      /* 5 */ "orange.png",
    ];

    const assertCostumesOrder = (indexes: Array<number>) =>
      assertCostumeNames(indexes.map((i) => originalOrder[i]));

    const getCostume = (stem: string) => cy.get(".AssetCard").contains(stem);
    const dragCostume = (movingStem: string, targetStem: string) =>
      getCostume(movingStem).drag(getCostume(targetStem));

    selectSprite("Snake");
    selectActorAspect("Costumes");

    addFromMediaLib(originalOrder.slice(1).map((n) => n.split(".")[0]));
    assertCostumesOrder([0, 1, 2, 3, 4, 5]);

    // Want to cover all feasible combinations of these cases:
    //
    // Drag:
    //   first costume,
    //   costume from somewhere in the middle
    //   last costume
    //
    // Drop:
    //   first costume
    //   higher than dragged one but not first or previous
    //   previous costume
    //   next costume
    //   lower than dragged one but not last or next
    //   last

    dragCostume(/* 0 */ "python-logo", /* 1 */ "apple"); // first -> next
    assertCostumesOrder([1, 0, 2, 3, 4, 5]);

    dragCostume(/* 1 */ "apple", /* 3 */ "bird"); // first -> lower
    assertCostumesOrder([0, 2, 3, 1, 4, 5]);

    dragCostume(/* 0 */ "python-logo", /* 5 */ "orange"); // first -> last
    assertCostumesOrder([2, 3, 1, 4, 5, 0]);

    dragCostume(/* 1 */ "apple", /* 2 */ "ball"); // middle -> first
    assertCostumesOrder([1, 2, 3, 4, 5, 0]);

    dragCostume(/* 4 */ "bowl", /* 2 */ "ball"); // middle -> higher
    assertCostumesOrder([1, 4, 2, 3, 5, 0]);

    dragCostume(/* 5 */ "orange", /* 3 */ "bird"); // middle -> previous
    assertCostumesOrder([1, 4, 2, 5, 3, 0]);

    dragCostume(/* 2 */ "ball", /* 5 */ "orange"); // middle -> next
    assertCostumesOrder([1, 4, 5, 2, 3, 0]);

    dragCostume(/* 4 */ "bowl", /* 3 */ "bird"); // middle -> lower
    assertCostumesOrder([1, 5, 2, 3, 4, 0]);

    dragCostume(/* 3 */ "bird", /* 0 */ "python-logo"); // middle -> last
    assertCostumesOrder([1, 5, 2, 4, 0, 3]);

    dragCostume(/* 3 */ "bird", /* 1 */ "apple"); // last -> first
    assertCostumesOrder([3, 1, 5, 2, 4, 0]);

    dragCostume(/* 0 */ "python-logo", /* 1 */ "apple"); // last -> higher
    assertCostumesOrder([3, 0, 1, 5, 2, 4]);

    dragCostume(/* 4 */ "bowl", /* 2 */ "ball"); // last -> previous
    assertCostumesOrder([3, 0, 1, 5, 4, 2]);
  });

  it("allows drag/drop reordering of sounds", () => {
    const expCostumeNames = [
      "python-logo.png",
      "apple.png",
      "ball.png",
      "bowl.png",
      "bird.png",
    ];

    const assertCostumesCorrect = () => {
      selectActorAspect("Costumes");
      assertCostumeNames(expCostumeNames);
    };

    const assertSoundsCorrect = (notesString: string) => {
      selectActorAspect("Sounds");
      const notes = notesString.split(" ");
      const expSounds = notes.map((n) => `beep-${n}.mp3`);
      assertSoundNames("sprite", expSounds);
    };

    const getNoteCard = (note: string) =>
      cy.get(".AssetCard").contains(`beep-${note}.mp3`);

    const dragSound = (movingNote: string, targetNote: string) =>
      getNoteCard(movingNote).drag(getNoteCard(targetNote));

    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles(["pytch-jr-5-costumes-4-sounds.zip"]);

    selectSprite("Snake");
    assertCostumesCorrect();
    assertSoundsCorrect("A4 C5 E5 A5");

    // While rearranging Sounds, Costumes should stay in same order.
    // We've been thorough in testing Costume reordering, so just check
    // a few reorderings with Sounds.

    dragSound("A4", "E5");
    assertSoundsCorrect("C5 E5 A4 A5");
    assertCostumesCorrect();

    dragSound("A4", "A5");
    assertSoundsCorrect("C5 E5 A5 A4");
    assertCostumesCorrect();

    dragSound("E5", "C5");
    assertSoundsCorrect("E5 C5 A5 A4");
    assertCostumesCorrect();
  });
});
