/// <reference types="cypress" />

import JSZip from "jszip";
import { cartesianProduct } from "../support";

context("Stage control actions", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  const chooseAction = (itemName: string) => {
    cy.contains("⋮").click();
    cy.contains(itemName).click();
  };

  it("can display and close the Screenshot modal", () => {
    chooseAction("Screenshot");
    cy.contains("on the image");

    // TODO: Would be good to check the image content, but that requires
    // quite a lot of machinery, and there are other priorities
    // currently.

    cy.get("button").contains("OK").click();
  });

  const downloadFilenameTestSpecs = [
    {
      labelFilename: "full-filename",
      inputFilename: "my-project.zip",
      expectedFilename: "my-project.zip",
    },
    {
      labelFilename: "stem-only",
      inputFilename: "cool-project",
      expectedFilename: "cool-project.zip",
    },
  ];

  const downloadInitiationTestSpecs = [{ kind: "click" }, { kind: "enter" }];

  const downloadTestSpecs = cartesianProduct(
    downloadFilenameTestSpecs,
    downloadInitiationTestSpecs
  );

  downloadTestSpecs.forEach((spec) => {
    const fullLabel =
      "can create a zipfile ready for download" +
      ` (${spec.labelFilename} / ${spec.kind})`;
    it(fullLabel, () => {
      chooseAction("Download");
      // We have 'instant delays', so never see the "Preparing" bit.
      cy.contains("Download zipfile");
      cy.window().then(async (window) => {
        let pytchCypress = (window as any)["PYTCH_CYPRESS"];
        pytchCypress["latestDownloadZipfile"] = null;

        const latestDownload = () => pytchCypress["latestDownloadZipfile"];

        cy.get(".modal-body input").type(`{selectAll}${spec.inputFilename}`);

        if (spec.kind === "click") {
          cy.get("button").contains("Download").click();
        } else {
          cy.get(".modal-body input").type("{enter}");
        }

        cy.waitUntil(() => latestDownload() != null).then(async () => {
          const download = latestDownload();

          expect(download.filename).equal(spec.expectedFilename);

          const blob = download.blob;
          const zipFile = await JSZip().loadAsync(blob);

          const codeText = await zipFile.file("code/code.py").async("string");
          expect(codeText).equal("import pytch\n\n");

          // Following file lengths taken from originals.

          const imageData = await zipFile
            .file("assets/red-rectangle-80-60.png")
            .async("uint8array");
          expect(imageData.byteLength).equal(217);

          const soundData = await zipFile
            .file("assets/sine-1kHz-2s.mp3")
            .async("uint8array");
          expect(soundData.byteLength).equal(32853);
        });
      });
    });
  });

  it("forbids download if filename empty", () => {
    chooseAction("Download");
    cy.get(".modal-body input").type("{selectAll}{del}{enter}");
    cy.get("button").contains("Download").should("be.disabled");
    cy.get(".modal-body input").type("project");
    cy.get("button").contains("Download").should("not.be.disabled");
    cy.get("button").contains("Cancel").click();
  });

  it("can launch the button tour", () => {
    chooseAction("tooltips");
    cy.pytchRunThroughButtonTour();
  });
});
