import { PytchProgramKind } from "../../../src/model/pytch-program";
import { assertInIDE, jumpToTutorialChapter } from "../utils";
import { kShiftTab, realPress } from "./utils";

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
  })
);
