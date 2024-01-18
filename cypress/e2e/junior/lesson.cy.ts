import { clickUniqueSelected } from "./utils";

context("Navigation of per-method lesson", () => {
  beforeEach(() => {
    cy.pytchJrLesson();
  });

  it("launches with lesson activity open", () => {
    cy.get(".ActivityContent .Junior-LessonContent-container").should(
      "be.visible"
    );
  });

  function clickToNextChapter() {
    clickUniqueSelected(".Junior-ChapterNavigation button.next");
  }

  function clickToPrevChapter() {
    clickUniqueSelected(".Junior-ChapterNavigation button.prev");
  }

  function assertChapterNumber(expNumber: number) {
    cy.get(".chapter-title .chapter-number").should(
      "have.text",
      `${expNumber} —`
    );
  }

  it("can move through chapters", () => {
    for (let i = 0; i !== 5; ++i) {
      clickToNextChapter();
      const expChapter = i + 1;
      assertChapterNumber(expChapter);
    }

    // Step backwards only four times, so we get back to Chapter 1
    // rather than the unnumbered introduction.
    for (let i = 0; i !== 4; ++i) {
      clickToPrevChapter();
      const expChapter = 4 - i;
      assertChapterNumber(expChapter);
    }
  });

  function requestMoreHelp(iLearnerTask: number, expButtonText: string) {
    return cy
      .get(".alert.LearnerTask")
      .eq(iLearnerTask)
      .find(".ShowNextHelpStageButton-container button")
      .should("have.text", expButtonText)
      .click();
  }
});
