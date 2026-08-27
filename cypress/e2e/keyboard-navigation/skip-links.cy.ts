import { SkipLinkFocusTarget } from "../../../src/model/junior/global-steer-focus";
import { PytchProgramKind } from "../../../src/model/pytch-program-types";
import { assertInIDE } from "../utils";
import { assertFocus, realPress } from "./utils";

type SkipLinkSpec = {
  target: SkipLinkFocusTarget;
  assertFun: () => void;
};
type SkipLinkTestSpec = {
  programKind: PytchProgramKind;
  projectZipfileFixture: string;
  skipSpecs: Array<SkipLinkSpec>;
};

const specs: Array<SkipLinkTestSpec> = [
  {
    programKind: "per-method",
    projectZipfileFixture: "newly-created-per-method.zip",
    skipSpecs: [
      {
        target: "activity-tab-bar",
        assertFun: () => assertFocus("activity-tab", "helpsidebar"),
      },
      {
        target: "per-method-actor-props",
        assertFun: () => assertFocus("add-script-button"),
      },
      {
        target: "project-stage",
        assertFun: () => assertFocus("stage"),
      },
      {
        target: "per-method-actors",
        assertFun: () => assertFocus("actor-card", 0),
      },
    ],
  },
  {
    programKind: "flat",
    projectZipfileFixture: "v4-print-things.zip",
    skipSpecs: [
      {
        target: "activity-tab-bar",
        assertFun: () => assertFocus("activity-tab", "helpsidebar"),
      },
      {
        target: "flat-code",
        assertFun: () => assertFocus("flat-code-editor"),
      },
      {
        target: "project-stage",
        assertFun: () => assertFocus("stage"),
      },
      {
        target: "flat-assets",
        assertFun: () => assertFocus("flat-asset", 0),
      },
    ],
  },
];

specs.forEach((spec) => {
  context(`Skip-links in ${spec.programKind} IDE`, () => {
    beforeEach(() => {
      cy.pytchResetDatabase();
      cy.pytchTryUploadZipfiles([spec.projectZipfileFixture]);
      assertInIDE(spec.programKind);
    });

    spec.skipSpecs.forEach(({ target, assertFun }, idx) => {
      const nTabs = idx + 1;
      it(`jumps on activation (${nTabs} tab/s)`, () => {
        realPress("Tab", nTabs);
        assertFocus("skip-link", target);

        realPress("Space");
        assertFun();
      });
    });
  });
});
