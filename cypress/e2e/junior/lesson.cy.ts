import { DiffViewKind, PrettyPrintedLine } from "../../../src/model/code-diff";
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

  it("can expand and contract help stages", () => {
    // Skip to chapter 3, which has a useful test case.
    for (let i = 0; i !== 3; ++i) clickToNextChapter();

    requestMoreHelp(-1, "Hint");
    cy.contains("Look at the existing code for moving right");

    requestMoreHelp(-1, "Hint");
    cy.contains("copy and paste the existing lines of code");

    requestMoreHelp(-1, "Show me");
    cy.contains("select the Code tab, and find this script");

    requestMoreHelp(-1, "Hide help");
    cy.contains("Look at the existing code").should("not.exist");
  });

  type CodeDiffViewKindCounts = {
    nContext?: number;
    nChange?: number;
    nAdd?: number;
    nDel?: number;
    nAddPadding?: number;
    nChangePadding?: number;
    nDelPadding?: number;
  };

  type PrettyPrintedLineKind = PrettyPrintedLine<null>["kind"];

  const divClassFromCountNameLut = new Map<
    keyof CodeDiffViewKindCounts,
    PrettyPrintedLineKind
  >([
    ["nContext", "context"],
    ["nChange", "change"],
    ["nAdd", "add"],
    ["nDel", "del"],
    ["nAddPadding", "add-padding"],
    ["nChangePadding", "change-padding"],
    ["nDelPadding", "del-padding"],
  ]);

  function divClassFromCountName(
    countName: keyof CodeDiffViewKindCounts
  ): PrettyPrintedLineKind {
    const mDivClass = divClassFromCountNameLut.get(countName);
    if (mDivClass == null)
      throw new Error(`internal test error: bad count-name ${countName}`);
    return mDivClass;
  }

  function assertActiveCodeDiffViewKindCounts(
    expCounts: CodeDiffViewKindCounts
  ) {
    cy.get(".ScriptDiff").should("have.length", 1).as("diff");
    for (const countKind of divClassFromCountNameLut.keys()) {
      const expCount = expCounts[countKind] ?? 0;
      const cls = divClassFromCountName(countKind);
      cy.get("@diff")
        .find(`.ScriptDiffView.isActive > div.${cls}`)
        .should("have.length", expCount);
    }
    cy.get("@diff");
  }

  function selectDiffViewKind(kind: DiffViewKind) {
    const selector = `.DiffViewKindOption[data-view-kind="${kind}"]`;
    cy.get(selector).should("have.length", 1).click();
    cy.get(selector).should("have.class", "isActive");
  }
});
