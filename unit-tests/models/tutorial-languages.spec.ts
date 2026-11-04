import { assert } from "chai";
import {
  displayedTutorials,
  withUniqueTutorialLanguages,
} from "../../src/model/tutorial-languages";
import {
  TutorialLanguage,
  TutorialSlugAndMetadata,
} from "../../src/model/tutorial-metadata";

function mockTutorial(
  slug: string,
  tutorialId: string,
  language: TutorialLanguage
): TutorialSlugAndMetadata {
  return {
    slug,
    metadata: {
      programKind: "flat",
      difficulty: "beginner",
      language,
      tutorialId,
      displayName: `Display name of ${slug}`,
    },
  };
}

const slugs = (tutorials: Array<TutorialSlugAndMetadata>) =>
  tutorials.map((t) => t.slug);

describe("Tutorial languages", () => {
  describe("withUniqueTutorialLanguages()", () => {
    let warnings: Array<string> = [];
    const originalWarn = console.warn;
    beforeEach(() => {
      warnings = [];
      console.warn = (msg: string) => warnings.push(msg);
    });
    afterEach(() => {
      console.warn = originalWarn;
    });

    it("keeps all if no duplicates", () => {
      const tutorials = [
        mockTutorial("boing", "boing", "en"),
        mockTutorial("boing--ga", "boing", "ga"),
        mockTutorial("hello", "hello", "en"),
      ];
      const got = withUniqueTutorialLanguages(tutorials);
      assert.deepEqual(slugs(got), ["boing", "boing--ga", "hello"]);
      assert.deepEqual(warnings, []);
    });

    it("keeps first of duplicates, with warning", () => {
      const tutorials = [
        mockTutorial("boing", "boing", "en"),
        mockTutorial("boing--ga", "boing", "ga"),
        mockTutorial("hello", "hello", "en"),
        mockTutorial("boing--ga-v2", "boing", "ga"),
      ];
      const got = withUniqueTutorialLanguages(tutorials);
      assert.deepEqual(slugs(got), ["boing", "boing--ga", "hello"]);
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /"boing--ga" and "boing--ga-v2"/);
    });
  });

  describe("displayedTutorials()", () => {
    const tutorials = [
      mockTutorial("hello", "hello", "en"),
      mockTutorial("fruit--ga", "fruit", "ga"),
      mockTutorial("fruit", "fruit", "en"),
      mockTutorial("boing", "boing", "en"),
      mockTutorial("boing--de", "boing", "de"),
    ];

    const specs: Array<{
      uiLanguage: string;
      expAll: Array<string>;
      expUiLanguage: Array<string>;
    }> = [
      {
        uiLanguage: "en",
        expAll: ["hello", "fruit", "boing"],
        expUiLanguage: ["hello", "fruit", "boing"],
      },
      {
        uiLanguage: "ga",
        expAll: ["hello", "fruit--ga", "boing"],
        expUiLanguage: ["fruit--ga"],
      },
      {
        uiLanguage: "de",
        expAll: ["hello", "fruit", "boing--de"],
        expUiLanguage: ["boing--de"],
      },
    ];

    for (const spec of specs) {
      it(`chooses translations for "${spec.uiLanguage}"`, () => {
        const display = (selector: "all" | "ui-language") =>
          slugs(displayedTutorials(tutorials, spec.uiLanguage, selector));
        assert.deepEqual(display("all"), spec.expAll);
        assert.deepEqual(display("ui-language"), spec.expUiLanguage);
      });
    }
  });
});
