import { jumpToTutorialChapter } from "../utils";
import {
  assertFocus,
} from "./utils";

context("Sbs tutorial", () => {
  beforeEach(() => {
    cy.pytchJrLesson();
    jumpToTutorialChapter(1);
    assertFocus("tutorial-content");
  });
});
