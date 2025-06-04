import JSZip from "jszip";
import { saveButton } from "../utils";
import {
  assertBackdropNames,
  launchDeleteActorByIndex,
  selectActorAspect,
  settleModalDialog,
} from "./utils";

context("Zipfiles", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  it("can download after deleting sprite", () => {
    cy.contains("My projects").click();
    cy.pytchTryUploadZipfiles(["per-method-four-scripts.zip"]);

    saveButton.shouldReactToInteraction(() => {
      launchDeleteActorByIndex(1);
      settleModalDialog("DELETE");
    });

    cy.get(".ActorCard")
      .should("have.length", 1)
      .invoke("attr", "data-actor-id")
      .then((idStr: string | undefined) => {
        if (idStr == null) throw new Error('no "data-actor-id" attr');

        cy.pytchChooseDropdownEntry("Download");
        cy.contains("Download zipfile");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cy.window().then(async (window: any) => {
          let pytchCypress = window["PYTCH_CYPRESS"];
          pytchCypress["latestDownloadZipfile"] = null;

          const latestDownload = () => pytchCypress["latestDownloadZipfile"];

          cy.get(".modal-body input").type(`{selectAll}cool-project`);
          cy.get("button").contains("Download").click();

          cy.waitUntil(() => latestDownload() != null).then(async () => {
            const download = latestDownload();

            expect(download.filename).equal("cool-project.zip");

            const blob = download.blob;
            const zipFile = await JSZip().loadAsync(blob);

            let gotPaths: Array<string> = [];
            zipFile.forEach((path) => gotPaths.push(path));

            const expPaths = [
              "version.json",
              "meta.json",
              "code/",
              "code/code.json",
              "assets/",
              "assets/files/",
              `assets/files/${idStr}/`,
              `assets/files/${idStr}/solid-white.png`,
              "assets/metadata.json",
            ];

            assert.deepEqual(gotPaths, expPaths);
          });
        });
      });
  });

  it("preserves backdrops order", { defaultCommandTimeout: 10000 }, () => {
    cy.contains("My projects").click();
    cy.pytchTryUploadZipfiles(["lots-of-backdrops.zip"]);
    selectActorAspect("Backdrops");

    let expNames = ["big-painting.jpg"];
    for (let i = 0; i !== 256; ++i) {
      const digits = i.toString().padStart(3, "0");
      const smallImageName = `solid-${digits}.png`;
      expNames.push(smallImageName);
    }

    assertBackdropNames(expNames);
  });
});
