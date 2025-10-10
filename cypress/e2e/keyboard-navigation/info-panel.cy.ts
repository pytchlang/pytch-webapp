import {
  assertInfoPanelState,
  loadFromZipfile,
} from "../junior/utils";
import { assertFocus } from "./utils";

context("Stdout/err info panel", () => {
  beforeEach(() => {
    loadFromZipfile("eight-grey-costumes.zip");
    assertInfoPanelState("expanded");
  });

  const assertDisclosureButtonFocused = () =>
    assertFocus("info-panel-disclosure-toggle");
});
