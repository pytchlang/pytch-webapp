import {
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";
import { assertFocus } from "./utils";

context("Working with scripts", () => {
  beforeEach(() => {
    loadFromZipfile("per-method-four-scripts.zip");
    selectSprite("Snake");
    selectActorAspect("Code", "tab");
    assertFocus("actor-property-tab", "code");
  });
});
