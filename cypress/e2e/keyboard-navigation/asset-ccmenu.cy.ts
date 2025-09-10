import {
  loadFromZipfile,
  selectActorAspect,
  selectSprite,
} from "../junior/utils";

context("Asset-card ccmenu", () => {
  beforeEach(() => {
    loadFromZipfile("eight-grey-costumes.zip");
    selectSprite("GreyThing");
    selectActorAspect("Costumes");
  });
});
