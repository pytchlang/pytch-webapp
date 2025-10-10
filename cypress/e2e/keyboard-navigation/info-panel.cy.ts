import {
  assertInfoPanelState,
  loadFromZipfile,
  toggleInfoPanelVisibility,
} from "../junior/utils";
import { assertFocus, kShiftTab, realPress } from "./utils";

context("Stdout/err info panel", () => {
  beforeEach(() => {
    loadFromZipfile("eight-grey-costumes.zip");
    assertInfoPanelState("expanded");
  });

  const assertDisclosureButtonFocused = () =>
    assertFocus("info-panel-disclosure-toggle");

  it("correct tab order when expanded", () => {
    toggleInfoPanelVisibility();
    toggleInfoPanelVisibility();
    assertInfoPanelState("expanded");

    realPress(kShiftTab);
    assertFocus("info-panel-tab", "output");
    realPress("ArrowRight");
    assertFocus("info-panel-tab", "errors");

    realPress("Tab");
    assertDisclosureButtonFocused();

    realPress("Tab");
    assertFocus("green-flag");

    realPress(kShiftTab);
    assertDisclosureButtonFocused();
  });
});
