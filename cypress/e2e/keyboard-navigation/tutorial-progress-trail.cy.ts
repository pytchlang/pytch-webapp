import { PytchProgramKind } from "../../../src/model/pytch-program";
import { assertInIDE, jumpToTutorialChapter } from "../utils";
import { assertFocus, kShiftTab, realPress } from "./utils";

const assertNodeFocused = (nodeIdx: number) =>
  assertFocus("progress-node", nodeIdx);

type ProgressTrailSpec = {
  ideKind: PytchProgramKind;
  setup: () => void;
  maxChapterIdx: number;
};
const progressTrailSpecs: Array<ProgressTrailSpec> = [
  {
    ideKind: "flat",
    setup: () => {
      cy.pytchProjectFollowingTutorial();
      jumpToTutorialChapter(2);
      realPress(kShiftTab);
    },
    maxChapterIdx: 15,
  },
  {
    ideKind: "per-method",
    setup: () => {
      // Use param so we can leap to a future chapter:
      cy.visit("tutorials/?allowRandomChapterAccessInTutorials");
      cy.get("ul.tutorial-list li:nth-child(2) button:nth-child(2)").click();
      assertInIDE("per-method");
      jumpToTutorialChapter(2);
      realPress(kShiftTab);
    },
    maxChapterIdx: 11,
  },
];
progressTrailSpecs.forEach((spec) =>
  context(`Tutorial progress trail (${spec.ideKind})`, () => {
    beforeEach(spec.setup);

    it("move focused node", () => {
      realPress("Home");
      assertNodeFocused(0);

      // Should have seven contiguous-chapter nodes, then a gap, then
      // the max chapter.
      for (let i = 0; i !== 6; i += 1) {
        realPress(i % 2 === 0 ? "ArrowRight" : "ArrowDown");
        assertNodeFocused(1 + i);
      }
      realPress("ArrowRight");
      assertNodeFocused(spec.maxChapterIdx);

      // Working back to the start should count down  chapters to zero.
      for (let i = 0; i !== 7; i += 1) {
        realPress(i % 2 === 0 ? "ArrowLeft" : "ArrowUp");
        assertNodeFocused(6 - i);
      }
    });
  })
);
