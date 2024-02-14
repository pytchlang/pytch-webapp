import { DiffViewKind, PrettyPrintedLine } from "../../../src/model/code-diff";
import {
  assertActorNames,
  clickUniqueSelected,
  getActivityBarTab,
  renameProject,
} from "./utils";

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
    if (expNumber === 0) {
      cy.get(".chapter-title").should("be.visible");
      cy.get(".chapter-title .chapter-number").should("not.exist");
      return;
    }

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

  it("saves chapter state per project", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.window().then((window: any) => {
      let pytchCypress = window.PYTCH_CYPRESS;
      pytchCypress.QUEUED_SYNC_TASK_DELAY = 1.5;

      // We have one lesson-linked project; make another.
      const goToMyProjects = () => {
        cy.pytchHomeFromIDE();
        cy.get(".NavBar").contains("My projects").click();
      };

      goToMyProjects();
      cy.get(".NavBar").contains("My projects").click();
      renameProject("script-by-script", "LESSON-LINKED-0");

      cy.get(".NavBar").contains("Tutorials").click();
      cy.get('.TutorialCard[data-slug="script-by-script-catch-apple"]')
        .contains("Tutorial")
        .click();

      goToMyProjects();
      renameProject("script-by-script", "LESSON-LINKED-1");

      cy.pytchOpenProject("LESSON-LINKED-0");
      for (let i = 0; i !== 5; ++i) {
        clickToNextChapter();
      }
      assertChapterNumber(5);

      cy.pytchSwitchProject("LESSON-LINKED-1");
      assertChapterNumber(0);

      cy.pytchSwitchProject("LESSON-LINKED-0");
      assertChapterNumber(5);
    });
  });

  function requestMoreHelp(iLearnerTask: number, expButtonText: string) {
    return cy
      .get(".alert.LearnerTask")
      .eq(iLearnerTask)
      .find(".ShowNextHelpStageButton-container button")
      .should("have.text", expButtonText)
      .click();
  }

  function clickTaskCheckbox(iLearnerTask: number) {
    cy.get(".alert.LearnerTask")
      .eq(iLearnerTask)
      .find(".to-do-checkbox")
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

  it("can mark a task completed", () => {
    clickToNextChapter();
    requestMoreHelp(0, "Show me");
    clickTaskCheckbox(0);
    cy.get(".alert.LearnerTask")
      .eq(0)
      .find(".LearnerTask-HelpStage")
      .should("not.exist");
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

  it("allows interaction with code diff", () => {
    // Skip to chapter 3, which has a useful test case.
    for (let i = 0; i !== 3; ++i) clickToNextChapter();
    // Expand help until and including "Show me":
    requestMoreHelp(-1, "Hint");
    requestMoreHelp(-1, "Hint");
    requestMoreHelp(-1, "Show me");

    assertActiveCodeDiffViewKindCounts({ nContext: 6 });
    selectDiffViewKind("old-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 6, nAddPadding: 3 });
    selectDiffViewKind("new-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 6, nAdd: 3 });

    // Skip on to chapter 10, which has a "change your code" (not just
    // add new code) task.
    for (let i = 3; i !== 10; ++i) clickToNextChapter();
    requestMoreHelp(-1, "Show me");
    assertActiveCodeDiffViewKindCounts({ nContext: 7 });
    selectDiffViewKind("old-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 6, nChange: 1 });
    selectDiffViewKind("new-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 6, nChange: 1 });
  });

  it("activity bar switching works", () => {
    const lesson = () => cy.get(".Junior-LessonContent-container");
    const help = () => cy.get(".HelpSidebar");
    const assertLessonVisible = () => lesson().should("be.visible");
    const assertNoLesson = () => lesson().should("not.exist");
    const assertHelpVisible = () => help().should("be.visible");
    const assertNoHelp = () => help().should("not.exist");
    const assertNoActivityContent = () =>
      cy.get(".ActivityContent").should("not.exist");

    for (let i = 0; i !== 3; ++i) clickToNextChapter();
    assertLessonVisible();

    getActivityBarTab("book").click();
    assertNoActivityContent();

    getActivityBarTab("circle-question").click();
    assertNoLesson();
    assertHelpVisible();

    getActivityBarTab("book").click();
    assertChapterNumber(3);
    assertNoHelp();

    getActivityBarTab("circle-question").click();
    assertNoLesson();
    assertHelpVisible();

    getActivityBarTab("circle-question").click();
    assertNoActivityContent();
  });
});

context("launch demo from tutorial card", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    cy.get(".NavBar li").contains("Tutorials").click();
  });

  it("works", () => {
    cy.get('.TutorialCard[data-slug="script-by-script-catch-apple"]')
      .contains("Demo")
      .click();
    cy.get(".Junior-IDEContents");
    assertActorNames(["Stage", "Bowl", "Apple", "ScoreKeeper"]);
  });
});
