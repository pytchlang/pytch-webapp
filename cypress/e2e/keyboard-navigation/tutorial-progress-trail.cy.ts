import { PytchProgramKind } from "../../../src/model/pytch-program";
import { range } from "../../../src/utils";
import { assertProgressTrailChapters } from "../junior/utils";
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

    const trailTail = Array.from(
      range(spec.maxChapterIdx - 6, spec.maxChapterIdx + 1)
    );

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

    it("activate other chapters", () => {
      realPress("ArrowRight", 3);
      assertNodeFocused(5);
      realPress("Enter");
      assertFocus("tutorial-content");
      realPress(kShiftTab);
      assertNodeFocused(5);
      assertProgressTrailChapters([0, 3, 4, 5, 6, 7, spec.maxChapterIdx]);
      realPress("ArrowRight");
      realPress("Enter");
      realPress(kShiftTab);
      assertNodeFocused(6);
      assertProgressTrailChapters([0, 4, 5, 6, 7, 8, spec.maxChapterIdx]);
      realPress("ArrowLeft");
      realPress("Enter");
      realPress(kShiftTab);
      assertNodeFocused(5);
      assertProgressTrailChapters([0, 3, 4, 5, 6, 7, spec.maxChapterIdx]);
      realPress("ArrowLeft");
      realPress("Enter");
      realPress(kShiftTab);
      assertNodeFocused(4);
      assertProgressTrailChapters([0, 1, 2, 3, 4, 5, 6, spec.maxChapterIdx]);
      realPress("End");
      assertNodeFocused(spec.maxChapterIdx);
      realPress("Enter");
      assertProgressTrailChapters([0].concat(trailTail));
    });
  })
);
