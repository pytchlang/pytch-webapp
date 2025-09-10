import { loadFromZipfile, selectSprite } from "../junior/utils";

context("Navigating actor properties", () => {
  beforeEach(() => {
    loadFromZipfile("per-method-four-scripts.zip");
    selectSprite("Snake");
  });
});
