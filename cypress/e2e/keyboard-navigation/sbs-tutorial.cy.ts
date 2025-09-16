import { jumpToTutorialChapter } from "../utils";
import {
  assertFocus,
  assertLearnerTaskDiffShown,
  assertLearnerTaskDoneState,
  assertLearnerTaskHelpNStages,
  assertLearnerTaskHelpState,
  kShiftTab,
  realPress,
} from "./utils";

context("Sbs tutorial", () => {
  beforeEach(() => {
    cy.pytchJrLesson();
    jumpToTutorialChapter(1);
    assertFocus("tutorial-content");
  });

  it("show solution", () => {
    realPress("Tab");
    assertFocus("learner-task-done-button", 0);
    assertLearnerTaskDoneState(0, "click-when-done");
    realPress("Tab");
    assertFocus("learner-task-help-button", 0);
    assertLearnerTaskHelpState(0, "show");
    realPress("Enter");
    assertFocus("learner-task-help-button", 0);
    assertLearnerTaskHelpNStages(0, 1);
    assertLearnerTaskHelpState(0, "hide");
    realPress("Enter");
    assertLearnerTaskHelpNStages(0, 0);
  });

  it("reveal hint and navigate solution", () => {
    // A bit tedious to advance through the tutorial to a point where
    // there is a hint.
    realPress("Tab");
    realPress("Enter");
    assertLearnerTaskDoneState(0, "click-to-rewind");
    realPress("Tab", 2);
    realPress("Enter");
    realPress("Tab", 2);
    realPress("Enter");
    realPress("Tab", 2);
    realPress("Enter");
    realPress("Tab", 3);

    assertFocus("learner-task-help-button", 4);
    assertLearnerTaskHelpNStages(4, 0);
    assertLearnerTaskHelpState(4, "hint");
    realPress("Enter");
    assertLearnerTaskHelpNStages(4, 1);
    assertLearnerTaskHelpState(4, "show");
    realPress("Enter");
    assertLearnerTaskHelpNStages(4, 2);
    assertLearnerTaskHelpState(4, "hide");

    realPress(kShiftTab, 2);
    assertFocus("learner-task-diff-tab", [4, 0]);
    assertLearnerTaskDiffShown(4, "bare-old");

    realPress("ArrowRight");
    assertFocus("learner-task-diff-tab", [4, 1]);
    assertLearnerTaskDiffShown(4, "old-diff");

    realPress("ArrowRight");
    assertFocus("learner-task-diff-tab", [4, 2]);
    assertLearnerTaskDiffShown(4, "new-diff");

    realPress("Tab", 2);
    realPress("Enter");
    assertLearnerTaskHelpNStages(4, 0);
    assertLearnerTaskHelpState(4, "hint");
  });
});
