/// <reference types="cypress" />

import JSZip from "jszip";
import { cartesianProduct } from "../support/e2e";
import { stageHalfHeight, stageHalfWidth } from "../../src/constants";

context("Stage control actions", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  it("can display and close the Screenshot modal", () => {
    cy.pytchChooseDropdownEntry("Screenshot");
    cy.contains("on the image");

    // TODO: Would be good to check the image content, but that requires
    // quite a lot of machinery, and there are other priorities
    // currently.

    cy.get("button").contains("OK").click();
  });

  it("can use the coordinate chooser", () => {
    cy.pytchChooseDropdownEntry("Show coordinates");
    cy.contains("Move pointer over stage to see (x, y)");

    // Some uncertainty about exactly where this click gets measured, so
    // allow some tolerance.
    const [clientX, clientY] = [80, 60];
    const [stageX, stageY] = [
      -stageHalfWidth + clientX,
      stageHalfHeight - clientY,
    ];

    cy.get(".CoordinateChooserOverlay").click(80, 60);

    const coordsRegExp = new RegExp("^\\(([-0-9]+), ([-0-9]+)\\)$");

    // TODO: Pull out utility function for matching copied text?  Also
    // used in "Tutorial share feature" test.
    cy.waitUntil(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.window().then((win: any) => {
        const copiedText: string =
          win["PYTCH_CYPRESS"]["latestTextCopied"] ?? "";
        const match = coordsRegExp.exec(copiedText);
        const [gotX, gotY] = [parseInt(match[1]), parseInt(match[2])];
        return Math.abs(gotX - stageX) < 2 && Math.abs(gotY - stageY) < 2;
      })
    );

    cy.get("button.close-button").click();
    cy.get(".CoordinateChooserBar").should("not.exist");
    cy.get(".CoordinateChooserOverlay").should("not.exist");

    // Entering full-screen should dismiss coord chooser.
    cy.pytchChooseDropdownEntry("Show coordinates");
    cy.contains("Move pointer over stage to see (x, y)");
    cy.get("button.full-screen").click();
    cy.get(".ProjectIDE.full-screen");
    cy.get("button.leave-full-screen").click();
    cy.get("button.wide-info");
    cy.get(".CoordinateChooserBar").should("not.exist");
    cy.get(".CoordinateChooserOverlay").should("not.exist");
  });

  // TODO: Further tweaks to behaviour:
  // Dismiss chooser if user gives focus to editor?  If user uses
  // "C-return" in editor?  If user uses browser back button to return
  // to "My Projects"?

  const downloadInitiationTestSpecs = [{ kind: "click" }, { kind: "enter" }];

  downloadInitiationTestSpecs.forEach((spec) => {
    const fullLabel = `can create a zipfile ready for download (${spec.kind})`;
    it(fullLabel, () => {
      cy.pytchChooseDropdownEntry("Download");
      // We have 'instant delays', so never see the "Preparing" bit.
      cy.contains("Download zipfile");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.window().then(async (window: any) => {
        let pytchCypress = window["PYTCH_CYPRESS"];
        pytchCypress["latestDownloadZipfile"] = null;

        const latestDownload = () => pytchCypress["latestDownloadZipfile"];

        cy.get(".modal-body input").type(`{selectAll}cool-project`);

        if (spec.kind === "click") {
          cy.get("button").contains("Download").click();
        } else {
          cy.get(".modal-body input").type("{enter}");
        }

        cy.waitUntil(() => latestDownload() != null).then(async () => {
          const download = latestDownload();

          expect(download.filename).equal("cool-project.zip");

          const blob = download.blob;
          const zipFile = await JSZip().loadAsync(blob);

          const existingFile = (path: string): JSZip.JSZipObject => {
            // Unclear why TypeScript tells me this returns JSZipObject
            // when the type file says it return JSZipObject | null.
            const obj = zipFile.file(path);
            expect(obj, `file "${path}" within zip`).not.null;
            return obj;
          };

          const codeJson = await existingFile("code/code.json").async("string");
          const program = JSON.parse(codeJson);
          expect(program.kind).equal("flat");
          expect(program.text).equal("import pytch\n\n");

          // Following file lengths taken from originals.

          const imageData = await existingFile(
            "assets/files/red-rectangle-80-60.png"
          ).async("uint8array");
          expect(imageData.byteLength).equal(217);

          const soundData = await existingFile(
            "assets/files/sine-1kHz-2s.mp3"
          ).async("uint8array");
          expect(soundData.byteLength).equal(32853);

          const assetMetadata = await existingFile(
            "assets/metadata.json"
          ).async("string");
          expect(assetMetadata.length).greaterThan(0);
        });
      });
    });
  });

  it("forbids download if filename empty", () => {
    cy.pytchChooseDropdownEntry("Download");
    cy.get(".modal-body input").type("{selectAll}{del}{enter}");
    cy.get("button").contains("Download").should("be.disabled");
    cy.get(".modal-body input").type("project");
    cy.get("button").contains("Download").should("not.be.disabled");
    cy.get("button").contains("Cancel").click();
  });

  it("can launch the button tour", () => {
    cy.pytchChooseDropdownEntry("tooltips");
    cy.pytchRunThroughButtonTour();
  });

  it("keeps tooltip position when changing layout", () => {
    const checkTooltipPosition = () => {
      cy.get(".pytch-static-tooltip").then(($tooltip) => {
        const leftTooltip = $tooltip[0].getBoundingClientRect().left;
        cy.get(".GreenFlag").then(($flag) => {
          const leftFlag = $flag[0].getBoundingClientRect().left;
          expect(leftFlag).to.equal(leftTooltip);
        });
      });
    };

    cy.pytchChooseDropdownEntry("tooltips");
    checkTooltipPosition();
    cy.get(".layout-icon.tall-code").click();
    checkTooltipPosition();
  });
});
