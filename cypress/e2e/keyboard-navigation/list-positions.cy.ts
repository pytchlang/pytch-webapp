import {
  launchAdd,
} from "../junior/utils";
import {
  assertFocus,
  realPress,
  kShiftTab,
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
});
