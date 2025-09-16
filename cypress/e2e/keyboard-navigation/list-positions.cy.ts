import {
  launchAdd,
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import {
  assertModalWithTitle,
  assertInIDE,
  jumpToTutorialChapter,
} from "../utils";
import {
  assertFocus,
  realPress,
  kShiftTab,
  activateFlatAsset,
} from "./utils";

context("Kbd-nav between lists-of-things", () => {
  it("medialib tags and entries", () => {
    cy.pytchProjectFollowingTutorial();
    launchAdd.assetFromMediaLibrary();
    cy.get("ul.ClipArtTagButtonCollection li:nth-child(6) button").click();
    assertFocus("medialib-tag", 5);
    realPress("Tab");
    assertFocus("medialib-entry", 0);
    realPress("ArrowRight", 2);
    assertFocus("medialib-entry", 2);
    realPress(kShiftTab);
    assertFocus("medialib-tag", 5);
    realPress("Home");
    realPress("Enter");
    realPress("Tab");
    assertFocus("medialib-entry", 0);
    realPress("ArrowRight", 4);
    assertFocus("medialib-entry", 4);
    realPress(kShiftTab);
    assertFocus("medialib-tag", 0);
    realPress("ArrowRight", 5);
    assertFocus("medialib-tag", 5);
    realPress("Enter");
    realPress("Tab");
    assertFocus("medialib-entry", 2);
  });

  function launchAddScriptModal() {
    loadFromZipfile("per-method-four-scripts.zip");
    selectSprite("Snake");
    selectActorAspect("Code", "tab");
    assertFocus("actor-property-tab", "code");
    realPress("Tab", 2);
    realPress("Enter");
    assertModalWithTitle("Choose hat block");
  }

  function launchAddFromMediaLib() {
    cy.pytchProjectFollowingTutorial();
    launchAdd.assetFromMediaLibrary();
  }

  function initFromZipfile(zipfileStem: string) {
    cy.pytchResetDatabase();
    cy.pytchTryUploadZipfiles([`${zipfileStem}.zip`]);
  }

  type ListPositionSpecT = {
    label: string;
    setup: () => void;
    assertFocus: () => void;
    assertNextFocus: () => void;
  };
  const listPositionSpecs: Array<ListPositionSpecT> = [
    // TODO
    {
      label: "medialib tag",
      setup: () => {
        launchAddFromMediaLib();
        cy.get("ul.ClipArtTagButtonCollection li:nth-child(6) button").click();
      },
      assertFocus: () => assertFocus("medialib-tag", 5),
      assertNextFocus: () => assertFocus("medialib-entry", 0),
    },
    {
      label: "medialib entry",
      setup: () => {
        launchAddFromMediaLib();
        cy.get(
          "ul.ClipArtEntriesList li:nth-child(11) div.clipart-card"
        ).click();
      },
      assertFocus: () => assertFocus("medialib-entry", 10),
      assertNextFocus: () => assertFocus("medialib-cancel-button"),
    },
    {
      label: "flat-asset",
      setup: () => {
        initFromZipfile("bubbles");
        activateFlatAsset(1);
      },
      assertFocus: () => assertFocus("flat-asset", 1),
      assertNextFocus: () => assertFocus("add-flat-asset-button"),
    },
    {
      label: "flat progress trail",
      setup: () => {
        cy.pytchProjectFollowingTutorial();
        jumpToTutorialChapter(2);

        // Activating chapter puts focus on the content; get it back to
        // the list item.
        assertFocus("tutorial-content");
        realPress(kShiftTab);
      },
      assertFocus: () => assertFocus("progress-node", 2),
      assertNextFocus: () => assertFocus("tutorial-content"),
    },
    {
      label: "per-method progress trail",
      setup: () => {
        // Use param so we can leap to a future chapter:
        cy.visit("tutorials/?allowRandomChapterAccessInTutorials");
        cy.get("ul.tutorial-list li:nth-child(2) button:nth-child(2)").click();
        assertInIDE("per-method");
        jumpToTutorialChapter(2);

        // Activating chapter puts focus on the content; get it back to
        // the list item.
        assertFocus("tutorial-content");
        realPress(kShiftTab);
      },
      assertFocus: () => assertFocus("progress-node", 2),
      assertNextFocus: () => assertFocus("tutorial-content"),
    },
  ];

  listPositionSpecs.forEach((spec) =>
    it(`set list bookmark with mouse (${spec.label})`, () => {
      spec.setup();
      spec.assertFocus();
      realPress("Tab");
      spec.assertNextFocus();
      realPress(kShiftTab);
      spec.assertFocus();
    })
  );
});
