import { jumpToTutorialChapter } from "../utils";
import {
  assertFocus,
  assertLearnerTaskDoneState,
  assertLearnerTaskHelpNStages,
  assertLearnerTaskHelpState,
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
});
