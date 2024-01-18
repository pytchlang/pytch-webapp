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
});
