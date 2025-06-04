import { ArrayRGBA } from "../support/types";
import { PixelStripSpecs, canvasOpsFromJQuery } from "./canvas-content-utils";

context("Watch variables", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  type InstanceVarWatcherSpec = {
    label: string;
    kwargsCode: string;
    expStyle: Partial<{
      left: string;
      right: string;
      top: string;
      bottom: string;
    }>;
  };

  const instanceVarWatcherSpecs: Array<InstanceVarWatcherSpec> = [
    {
      label: "default",
      kwargsCode: "",
      expStyle: { left: "4px", top: "4px" },
    },
    {
      label: "top-left",
      kwargsCode: ", top=176, left=-236",
      expStyle: { left: "4px", top: "4px" },
    },
    {
      label: "top-right",
      kwargsCode: ", top=176, right=236",
      expStyle: { right: "4px", top: "4px" },
    },
    {
      label: "bottom-left",
      kwargsCode: ", bottom=-176, left=-236",
      expStyle: { left: "4px", bottom: "4px" },
    },
    {
      label: "bottom-right",
      kwargsCode: ", bottom=-176, right=236",
      expStyle: { right: "4px", bottom: "4px" },
    },
  ];

  instanceVarWatcherSpecs.forEach((spec) => {
    it(`shows a Sprite instance variable (${spec.label})`, () => {
      cy.pytchBuildCode(`
        import pytch

        class Banana(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]

          @pytch.when_key_pressed("s")
          def show_score(self):
            self.score = 42
            pytch.show_variable(self, "score"${spec.kwargsCode})

          @pytch.when_key_pressed("h")
          def hide_score(self):
            pytch.hide_variable(self, "score")
      `);

      cy.pytchSendKeysToProject("s");

      cy.get(".attribute-watcher").as("watcher").should("have.length", 1);

      for (const attr of ["left", "right", "top", "bottom"] as const) {
        const mExpCssValue = spec.expStyle[attr];
        if (mExpCssValue != null) {
          cy.get("@watcher").should("have.css", attr, mExpCssValue);
        }
      }

      cy.pytchSendKeysToProject("h");
      cy.get("@watcher").should("not.exist");
    });
  });

  [
    {
      label: "min-size",
      setStageSize: () => cy.viewport(960, 960),
      expStageSize: [320, 240],
    },
  ].forEach((spec) => {
    it(`adjusts for stage scaling (${spec.label})`, () => {
      spec.setStageSize();
      cy.get("#pytch-speech-bubbles")
        .as("bubblesDiv")
        .should("not.have.class", "resize-active");

      cy.pytchBuildCode(`
        import pytch

        class Banana(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]

          @pytch.when_key_pressed("s")
          def show_score(self):
            self.score = 42
            pytch.show_variable(self, "score", left=0, bottom=0)
      `);

      cy.pytchSendKeysToProject("s");

      cy.get("@bubblesDiv").then(($div) => {
        const stageWd = $div.width();
        const stageHt = $div.height();
        cy.wrap(stageWd).should("eq", spec.expStageSize[0]);
        cy.wrap(stageHt).should("eq", spec.expStageSize[1]);
        if (stageWd == null || stageHt == null)
          throw new Error("missing wd/ht");
        cy.get(".attribute-watcher")
          .should("have.css", "left", `${stageWd / 2}px`)
          .should("have.css", "bottom", `${stageHt / 2}px`);
      });
    });
  });

  [
    {
      label: "no such attr",
      objectCode: "self",
      attrName: "score",
      errorIntroRegexp: /owned by.*Sprite.*Banana/,
      errorDetailRegexp: /has no attribute.*score/,
    },
    {
      label: "get-property raises error",
      objectCode: "self",
      attrName: "oh_no",
      errorIntroRegexp: /owned by.*Sprite.*Banana/,
      errorDetailRegexp: /division by zero/,
      expTracebackLength: 1,
    },
    {
      label: "no such global",
      objectCode: "None",
      attrName: "score",
      errorIntroRegexp: /owned by the global project/,
      errorDetailRegexp: /has no attribute.*score/,
    },
    {
      label: "no such non-Actor attr",
      objectCode: "GameState",
      attrName: "score",
      errorIntroRegexp: /owned by an unknown/,
      errorDetailRegexp: /has no attribute.*score/,
    },
  ].forEach((spec) => {
    it(`reports error in watcher (${spec.label})`, () => {
      cy.pytchBuildCode(`
        import pytch

        class GameState:
          pass

        class Banana(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]

          @pytch.when_key_pressed("m")
          def go_to_corner(self):
            self.go_to_xy(240, 180)

          @property
          def oh_no(self):
            return 1 / 0

          @pytch.when_key_pressed("s")
          def show_score(self):
            pytch.show_variable(${spec.objectCode}, "${spec.attrName}")
      `);

      cy.pytchSendKeysToProject("s");

      cy.pytchShouldShowErrorContext("has stopped");

      cy.get(".ErrorReportAlert")
        .contains("While trying to show the value of the variable")
        .contains(spec.errorIntroRegexp);

      cy.pytchShouldShowErrorCard(spec.errorDetailRegexp, "user-space");

      if (spec.expTracebackLength != null) {
        cy.pytchShouldHaveErrorStackTraceOfLength(spec.expTracebackLength);
      }

      // The following is a roundabout way of testing that the variable
      // watchers are cleared on error (within the VM).  At one point
      // they weren't, and this showed up as follows: When a project
      // raised an error in a variable-watcher getattr(), trying to go
      // fullscreen caused a re-render which included the same
      // error-raising watcher.

      const redColour = [255, 0, 0, 255] as ArrayRGBA;

      cy.get(".StageControls button.full-screen").click();
      cy.get(".FullScreenLayout");
      cy.wait(100);
      cy.get("#pytch-speech-bubbles").focus();
      cy.pytchSendKeysToApp("m");
      cy.get("#pytch-canvas").then(($canvas) => {
        const canvasWd = ($canvas[0] as HTMLCanvasElement).width;
        const expPixelStrips: PixelStripSpecs = [
          {
            sliceOffset: Math.round((canvasWd * 470) / 480),
            runs: [{ begin: 0, end: 25, colour: redColour }],
          },
        ];
        const cOps = canvasOpsFromJQuery($canvas);
        cy.waitUntil(() => cOps.allVStripsMatch(expPixelStrips)).then(() => {
          cy.get("button.leave-full-screen").click();
        });
      });
    });
  });

  it("clears watchers on build", () => {
    cy.pytchBuildCode(`
      import pytch

      class Banana(pytch.Sprite):
        Costumes = ["red-rectangle-80-60.png"]

        @pytch.when_key_pressed("s")
        def show_score(self):
          self.score = 42
          pytch.show_variable(self, "score")
    `);

    cy.pytchSendKeysToProject("s");
    cy.get(".attribute-watcher").should("have.length", 1);

    cy.pytchBuild();
    cy.get(".attribute-watcher").should("have.length", 0);
  });
});
