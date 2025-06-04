import { range } from "../../../src/utils";
import { saveButton } from "../utils";
import {
  addFromMediaLib,
  assertCostumeIndexLabels,
  assertCostumeNames,
  assertSoundNames,
  initiateAddFromMediaLib,
  selectActorAspect,
  selectSprite,
  settleModalDialog,
} from "./utils";

context("Drag/drop of junior assets", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const addAllFromMediaLibEntry = (entry: string, expNItems: number) => {
    initiateAddFromMediaLib([entry]);
    const expButtonMatch = `Add ${expNItems}`;
    settleModalDialog(expButtonMatch);
  };

  const getCostume = (stem: string) => cy.get(".AssetCard").contains(stem);

  const dragCostume = (movingStem: string, targetStem: string) =>
    getCostume(movingStem).drag(getCostume(targetStem));

  it("allows drag/drop reordering of costumes", () => {
    const originalOrder = [
      /* 0 */ "python-logo.png",
      /* 1 */ "apple.png",
      /* 2 */ "ball.png",
      /* 3 */ "bird.png",
      /* 4 */ "bowl.png",
      /* 5 */ "orange.png",
    ];

    const nCostumes = originalOrder.length;

    // Also asserts that index labels remain correct throughout:
    const assertCostumesOrder = (indexes: Array<number>) => {
      assertCostumeNames(indexes.map((i) => originalOrder[i]));
      assertCostumeIndexLabels(nCostumes);
    };

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

    const dragSound = (movingNote: string, targetNote: string) => {
      selectActorAspect("Sounds");
      getNoteCard(movingNote).drag(getNoteCard(targetNote));
    };

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

  it("sorts >10 entries correctly", () => {
    // This is a slightly paranoid test that ordering the assets by
    // sortKey does so with numeric comparisons not JavaScript's
    // "convert everything to a string" comparison.  I have looked at
    // the source but want to actually test too.

    const digits = range(10).map((d) => `digit-${d}.png`);
    const buttons = [
      "button-question.png",
      "button-ans-A.png",
      "button-ans-B.png",
      "button-ans-C.png",
      "button-ans-D.png",
    ];

    let expCostumeNames = ["python-logo.png"];
    expCostumeNames.push(...digits);
    expCostumeNames.push(...buttons);

    selectSprite("Snake");
    selectActorAspect("Costumes");
    addAllFromMediaLibEntry("digits", 10);
    addAllFromMediaLibEntry("quiz buttons", 5);
    assertCostumeNames(expCostumeNames);
    assertCostumeIndexLabels(expCostumeNames.length);
  });

  it("updates mtime when reordering costumes", () => {
    const sbsName = "Per-method test project";
    const flatName = "Test seed project";

    selectSprite("Snake");
    selectActorAspect("Costumes");
    addFromMediaLib(["apple"]);

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.pytchProjectNamesShouldDeepEqual([sbsName, flatName]);

    cy.pytchOpenProject(flatName);
    saveButton.click();

    cy.go("back");
    cy.pytchProjectNamesShouldDeepEqual([flatName, sbsName]);

    cy.pytchOpenProject(sbsName);
    selectSprite("Snake");
    selectActorAspect("Costumes");
    dragCostume("apple", "python-logo");
    assertCostumeNames(["apple.png", "python-logo.png"]);

    cy.go("back");
    cy.pytchProjectNamesShouldDeepEqual([sbsName, flatName]);
  });
});
