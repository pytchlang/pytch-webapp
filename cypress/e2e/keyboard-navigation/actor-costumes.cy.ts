import {
  assertCostumeNames,
  doReorderAssetByIndex,
  focusActorAssetViaMouse,
  launchActorAssetDropdown,
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
  selectStage,
  settleModalDialog,
} from "../junior/utils";
import {
  assertFocus,
  chooseCcMenuItem,
  KeyOrShortcut,
  kShiftTab,
  realPress,
  summonCcMenuByKbd,
} from "./utils";

context("Working with costumes", () => {
  beforeEach(() => {
    loadFromZipfile("eight-grey-costumes.zip");
    selectSprite("GreyThing");
  });

  it("remembers focused costume", () => {
    selectActorAspect("Costumes");
    realPress("Tab");
    assertFocus("appearance-card", 0);
    realPress("ArrowDown", 2);
    realPress("ArrowRight", 4);
    assertFocus("appearance-card", 6);
    summonCcMenuByKbd();
    assertFocus("appearance-card-menu-item", [6, 0]);
    realPress("Escape");
    realPress("Tab");
    assertFocus("add-appearance-button");
    realPress(kShiftTab);
    assertFocus("appearance-card", 6);
    realPress(kShiftTab);
    assertFocus("actor-property-tab", "appearances");
    realPress("ArrowRight");
    assertFocus("actor-property-tab", "sounds");
    realPress(kShiftTab, 2);
    assertFocus("activity-tab", "helpsidebar");
    selectActorAspect("Costumes");
    realPress("Tab");
    assertFocus("appearance-card", 6);

    selectStage();
    selectActorAspect("Backdrops");
    realPress("Tab");
    assertFocus("appearance-card", 0);

    selectSprite("GreyThing");
    selectActorAspect("Costumes");
    realPress("Tab");
    assertFocus("appearance-card", 6);
  });

  it("mix mouse/kbd focus", () => {
    selectActorAspect("Costumes");

    function clickAndAssertFocus(idx: number) {
      focusActorAssetViaMouse(idx);
      assertFocus("appearance-card", idx);
      realPress("Tab");
      assertFocus("add-appearance-button");
      realPress(kShiftTab);
      assertFocus("appearance-card", idx);
      summonCcMenuByKbd();
      assertFocus("appearance-card-menu-item", [idx, 0]);
      realPress("Escape");
      realPress(kShiftTab);
      assertFocus("actor-property-tab", "appearances");
      realPress("Tab");
      assertFocus("appearance-card", idx);
    }

    function kbdNavAndAssertFocus(
      key: KeyOrShortcut,
      nPresses: number,
      expIdx: number
    ) {
      realPress(key, nPresses);
      assertFocus("appearance-card", expIdx);
    }

    clickAndAssertFocus(4);
    kbdNavAndAssertFocus("ArrowDown", 2, 6);
    clickAndAssertFocus(2);
    kbdNavAndAssertFocus("Home", 1, 0);
    clickAndAssertFocus(5);
    kbdNavAndAssertFocus("End", 1, 7);
  });

  it("re-order costumes", () => {
    function assertCostumeNubs(expIndexes: Array<number>) {
      const expNames = expIndexes.map(
        (i) => `solid-${i.toString().padStart(3, "0")}.png`
      );
      assertCostumeNames(expNames);
    }

    chooseCcMenuItem(1); // "Go to costumes"
    assertFocus("appearance-card", 0);

    realPress("ArrowDown", 2);
    realPress("ArrowRight", 3);
    assertFocus("appearance-card", 5);

    chooseCcMenuItem(3); // move earlier
    assertFocus("appearance-card", 4);
    assertCostumeNubs([0, 1, 2, 3, 5, 4, 6, 7]);

    doReorderAssetByIndex(4, "earlier");
    assertFocus("appearance-card", 3);
    assertCostumeNubs([0, 1, 2, 5, 3, 4, 6, 7]);

    launchActorAssetDropdown(3);
    realPress("ArrowDown", 3); // move earlier
    realPress("Enter");
    assertFocus("appearance-card", 2);
    assertCostumeNubs([0, 1, 5, 2, 3, 4, 6, 7]);

    doReorderAssetByIndex(2, "earlier");
    assertFocus("appearance-card", 1);
    assertCostumeNubs([0, 5, 1, 2, 3, 4, 6, 7]);

    realPress("ArrowRight", 2);
    chooseCcMenuItem(5);
    settleModalDialog("DELETE");
    assertFocus("appearance-card", 3);
    assertCostumeNubs([0, 5, 1, 3, 4, 6, 7]);

    doReorderAssetByIndex(4, "later");
    assertFocus("appearance-card", 5);
    assertCostumeNubs([0, 5, 1, 3, 6, 4, 7]);
  });
});
