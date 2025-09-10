import {
  loadFromZipfile,
  selectSprite,
} from "../junior/utils";

context("Working with costumes", () => {
  beforeEach(() => {
    loadFromZipfile("eight-grey-costumes.zip");
    selectSprite("GreyThing");
  });
});
