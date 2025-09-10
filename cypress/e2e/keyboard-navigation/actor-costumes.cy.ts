import {
  focusActorAssetViaMouse,
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
  selectStage,
} from "../junior/utils";
import {
  assertFocus,
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
});
