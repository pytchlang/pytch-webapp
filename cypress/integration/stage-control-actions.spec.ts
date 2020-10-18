/// <reference types="cypress" />

import JSZip from "jszip";

context("stage control actions", () => {
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

  const downloadTestSpecs = [
    {
      label: "full-filename",
      inputFilename: "my-project.zip",
      expectedFilename: "my-project.zip",
    },
    {
      label: "stem-only",
      inputFilename: "cool-project",
      expectedFilename: "cool-project.zip",
    },
  ];

  downloadTestSpecs.forEach((spec) =>
  it(`can create a zipfile ready for download (${spec.label})`, () => {
    chooseAction("Download");
    // We have 'instant delays', so never see the "Preparing" bit.
    cy.contains("Download zipfile");
    cy.window().then(async (window) => {
      let pytchCypress = (window as any)["PYTCH_CYPRESS"];
      pytchCypress["latestDownloadZipfile"] = null;

      const latestDownload = () => pytchCypress["latestDownloadZipfile"];

      cy.get(".modal-body input").type(`{selectAll}${spec.inputFilename}`);

      cy.get("button")
        .contains("Download")
        .click()
        .waitUntil(() => latestDownload() != null)
        .then(async () => {
          const download = latestDownload();

          expect(download.filename).equal(spec.expectedFilename);

          const blob = download.blob;
          const zipFile = await JSZip().loadAsync(blob);

          const codeText = await zipFile.file("code.py").async("string");
          expect(codeText).equal("import pytch\n\n");

          // Following file lengths taken from originals.

          const imageData = await zipFile
            .file("red-rectangle-80-60.png")
            .async("uint8array");
          expect(imageData.byteLength).equal(217);

          const soundData = await zipFile
            .file("sine-1kHz-2s.mp3")
            .async("uint8array");
          expect(soundData.byteLength).equal(32853);
        });
    });
  })
  );
});
