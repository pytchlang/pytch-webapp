import { DiffViewKind, PrettyPrintedLine } from "../../../src/model/code-diff";
import { LinkedJrTutorialRef } from "../../../src/model/junior/jr-tutorial";
import { assertInIDE, withDownloadedZipfile } from "../utils";
import {
  assertActorNames,
  assertJrTutChapterNumber,
  assertTwoStateSwitchState,
  clickUniqueSelected,
  getActivityBarTab,
  renameProject,
  settleModalDialog,
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

  function markCurrentTaskDone(nTasksAlreadyDone: number) {
    const expNOldTasks = Math.max(0, nTasksAlreadyDone - 1);
    cy.get(".LearnerTask.learner-task-old").should("have.length", expNOldTasks);

    const expNPreviousTasks = Math.min(1, nTasksAlreadyDone);
    cy.get(".LearnerTask.learner-task-previous").should(
      "have.length",
      expNPreviousTasks
    );

    cy.get(".LearnerTask.learner-task-current")
      .should("have.length", 1)
      .find(".to-do-checkbox")
      .click();
  }

  function markInitialTasksDone(nTasks: number, nTasksInChapter?: number) {
    for (let iTask = 0; iTask < nTasks; ++iTask) {
      markCurrentTaskDone(iTask);
      if (nTasksInChapter != null) {
        const expNextButtonExists = iTask === nTasksInChapter - 1;
        const predicate = expNextButtonExists ? "exist" : "not.exist";
        cy.get(".Junior-ChapterNavigation button.next").should(predicate);
      }
    }
  }

  function markPreviousTaskNotDone(nTasksToMarkNotDone = 1) {
    for (let i = 0; i < nTasksToMarkNotDone; ++i) {
      cy.get(".LearnerTask.learner-task-previous")
        .should("have.length", 1)
        .find(".to-do-checkbox")
        .click();
    }
  }

  // This will need updating if we change the "Script by script catch
  // apple" lesson used for the test:
  const nTasksByChapter = [0, 5, 1, 3, 5, 2, 1, 5, 2, 4, 2, 4, 0];

  function advanceToNextChapter(iCurrentChapter: number) {
    const nTasks = nTasksByChapter[iCurrentChapter];
    markInitialTasksDone(nTasks, nTasks);
    clickUniqueSelected(".Junior-ChapterNavigation button.next");
  }

  function jumpToChapter(targetIndex: number) {
    cy.get(
      `.progress-node-hover-target[data-chapter-index="${targetIndex}"]`
    ).click();
  }

  it("can move through chapters", () => {
    for (let i = 0; i !== 5; ++i) {
      advanceToNextChapter(i);
      const expChapter = i + 1;
      assertJrTutChapterNumber(expChapter);
    }

    // Jump directly back one at a time until chapter 1.
    for (let i = 4; i !== 0; --i) {
      jumpToChapter(i);
      assertJrTutChapterNumber(i);
    }
  });

  it("fresh interaction state in zipfile", () => {
    const assertInteractionStateInZip = (
      expChapterIndex: number,
      expNTasksDone: number
    ) => {
      withDownloadedZipfile("click", async (fileFromZip) => {
        const meta = JSON.parse(await fileFromZip("meta.json").async("string"));
        const lcRef = meta.linkedContentRef as LinkedJrTutorialRef;
        expect(lcRef.kind).equal("jr-tutorial");
        expect(lcRef.interactionState.chapterIndex).equal(expChapterIndex);
        expect(lcRef.interactionState.nTasksDone).equal(expNTasksDone);
      });
    };

    assertInteractionStateInZip(0, 0);

    let expNTasks = 0;
    const expChapterIndex = 4;
    for (let i = 0; i < expChapterIndex; ++i) {
      advanceToNextChapter(i);
      expNTasks += nTasksByChapter[i];
    }

    assertInteractionStateInZip(expChapterIndex, expNTasks);
  });

  it("obeys keep-link setting", () => {
    cy.title().should("not.match", /Pytch: Copy of/);
    for (let i = 0; i !== 3; ++i) advanceToNextChapter(i);

    cy.pytchChooseDropdownEntry("Make a copy");
    assertTwoStateSwitchState("keep-content-link-switch", true);
    settleModalDialog("Make a copy");

    cy.title().should("match", /Pytch: Copy of/);
    assertJrTutChapterNumber(3);
    cy.get('.LearnerTask[data-task-index="6"][data-task-kind="current"]');

    // help-sidebar, lesson, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar li.ActivityBarTab").should("have.length", 4);
  });

  it("obeys sever-link setting", () => {
    cy.title().should("not.match", /Pytch: Copy of/);

    cy.pytchChooseDropdownEntry("Make a copy");
    cy.get(".TwoStateSwitch.keep-content-link-switch").click();
    assertTwoStateSwitchState("keep-content-link-switch", false);
    settleModalDialog("Make a copy");

    cy.title().should("match", /Pytch: Copy of/);
    cy.get(".Junior-LessonContent").should("not.exist");

    // help-sidebar, keynav-help-sidebar, language-choice
    cy.get(".ActivityBar li.ActivityBarTab").should("have.length", 3);
  });

  it(
    "saves chapter state per project",
    { defaultCommandTimeout: 30000 },
    () => {
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

        cy.pytchTutorialsFromHome();
        cy.get('.TutorialCard[data-slug="script-by-script-catch-apple"]')
          .contains("Tutorial")
          .click();

        goToMyProjects();
        renameProject("script-by-script", "LESSON-LINKED-1");

        cy.pytchOpenProject("LESSON-LINKED-0");
        for (let i = 0; i !== 5; ++i) {
          advanceToNextChapter(i);
        }
        assertJrTutChapterNumber(5);

        cy.pytchSwitchProject("LESSON-LINKED-1");
        assertJrTutChapterNumber(0);

        cy.pytchSwitchProject("LESSON-LINKED-0");
        assertJrTutChapterNumber(5);
      });
    }
  );

  function requestMoreHelp(iLearnerTask: number, expButtonText: string) {
    return cy
      .get(".alert.LearnerTask")
      .eq(iLearnerTask)
      .find(".LearnerTaskButtonStrip button")
      .eq(1)
      .should("have.text", expButtonText)
      .click();
  }

  it("can expand and contract help stages", () => {
    // Skip to chapter 3, which has a useful test case.
    for (let i = 0; i !== 3; ++i) advanceToNextChapter(i);
    markInitialTasksDone(2);

    requestMoreHelp(-1, "Hint");
    cy.contains("Look at the existing code for moving right");

    requestMoreHelp(-1, "Hint");
    cy.contains("copy and paste the existing lines of code");

    requestMoreHelp(-1, "Show me");
    cy.contains("select the Code tab, and find this script");

    requestMoreHelp(-1, "Hide help");
    cy.contains("Look at the existing code").should("not.be.visible");
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
    cy.get(".ScriptDiff:visible").should("have.length", 1).as("diff");
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
    const tabSelector = `.DiffViewKindOption[data-view-kind="${kind}"]`;
    const selector = `.ScriptDiff:visible ${tabSelector}`;
    cy.get(selector).should("have.length", 1).click();
    cy.get(selector).should("have.class", "isActive");
  }

  it("allows interaction with code diff", () => {
    // Skip to chapter 3, whose third task is a useful test case.
    for (let i = 0; i !== 3; ++i) advanceToNextChapter(i);
    markInitialTasksDone(2);

    // Expand help until and including "Show me":
    requestMoreHelp(-1, "Hint");
    requestMoreHelp(-1, "Hint");
    requestMoreHelp(-1, "Show me");

    assertActiveCodeDiffViewKindCounts({ nContext: 7 });
    selectDiffViewKind("old-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 7, nAddPadding: 3 });
    selectDiffViewKind("new-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 7, nAdd: 3 });

    // Wind back to fresh state of chapter.
    markPreviousTaskNotDone(2);

    // Skip on to chapter 10, whose third task is a "change your code"
    // (not just add new code) task.
    for (let i = 3; i !== 10; ++i) advanceToNextChapter(i);
    markInitialTasksDone(2);

    requestMoreHelp(-1, "Show me");
    assertActiveCodeDiffViewKindCounts({ nContext: 8 });
    selectDiffViewKind("old-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 7, nChange: 1 });
    selectDiffViewKind("new-diff");
    assertActiveCodeDiffViewKindCounts({ nContext: 7, nChange: 1 });
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

    for (let i = 0; i !== 3; ++i) advanceToNextChapter(i);
    assertLessonVisible();

    getActivityBarTab("book").click();
    assertNoActivityContent();

    getActivityBarTab("circle-question").click();
    assertNoLesson();
    assertHelpVisible();

    getActivityBarTab("book").click();
    assertJrTutChapterNumber(3);
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
    cy.pytchTutorialsFromHome();
  });

  it("works", () => {
    cy.get('.TutorialCard[data-slug="script-by-script-catch-apple"]')
      .contains("Demo")
      .click();
    assertInIDE("per-method");
    assertActorNames(["Stage", "Bowl", "Apple", "ScoreKeeper"]);
  });
});
