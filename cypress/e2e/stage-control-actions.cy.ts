/// <reference types="cypress" />

import { stageHalfHeight, stageHalfWidth } from "../../src/constants";
import { assertCopiedText, withDownloadedZipfile } from "./utils";

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
    cy.get(".CoordsChooserBarMessage")
      .should("contain.text", "Click or Enter to copy")
      .find(".coords")
      .should("have.text", "(x:    0, y:    0)");

    // Some uncertainty about exactly where this click gets measured, so
    // allow some tolerance.
    const [clientX, clientY] = [80, 60];
    const [stageX, stageY] = [
      -stageHalfWidth + clientX,
      stageHalfHeight - clientY,
    ];

    cy.get(".CoordinateChooserOverlay").click(clientX, clientY);

    const coordsRegExp = new RegExp("^\\(([-0-9]+), ([-0-9]+)\\)$");

    assertCopiedText((text) => {
      const match = coordsRegExp.exec(text);
      if (match == null) {
        return false;
      }

      const [gotX, gotY] = [parseInt(match[1]), parseInt(match[2])];
      return Math.abs(gotX - stageX) < 2 && Math.abs(gotY - stageY) < 2;
    });

    cy.get("button.close-button").click();
    cy.get(".CoordinateChooserBar").should("not.exist");
    cy.get(".CoordinateChooserOverlay").should("not.exist");
  });

  it("can use the coordinate chooser with keyboard", () => {
    const assertCoords = (barText: string, announcement: string) => {
      cy.get(".CoordsChooserBarMessage .coords").should("have.text", barText);
      cy.get(".CoordsChooserAnnouncer").should("have.text", announcement);
    };

    cy.get(".CoordsChooserAnnouncer").should("have.text", "");
    cy.pytchChooseDropdownEntry("Show coordinates");
    cy.get(".CoordinateChooserOverlay")
      .should("have.focus")
      .should("have.attr", "role", "application")
      .should("have.attr", "aria-label", "Stage")
      .should("have.attr", "aria-roledescription", "coordinate chooser")
      .invoke("attr", "aria-describedby")
      .then((descriptionId) => {
        cy.get(`[id="${descriptionId}"]`).should(
          "contain.text",
          "Arrow keys move by 10"
        );
      });
    cy.get(".CoordinateChooserOverlay .grid").should(
      "have.attr",
      "aria-hidden",
      "true"
    );
    cy.get("button.close-button").should(
      "have.attr",
      "aria-label",
      "Close coordinate chooser"
    );

    cy.realPress("ArrowRight");
    cy.realPress("ArrowRight");
    cy.realPress("ArrowDown");
    cy.realPress(["Shift", "ArrowUp"]);
    assertCoords("(x:   20, y:   -9)", "x 20, y -9");

    cy.realPress("Enter");
    assertCopiedText("(20, -9)");
    cy.get(".CoordsChooserAnnouncer").should("have.text", "Copied x 20, y -9");

    cy.realPress("Home");
    assertCoords("(x:    0, y:    0)", "x 0, y 0");

    // Clamped at the edge, and saying so.  The text does not change on
    // the further press, but the node should be replaced so that a
    // screen reader re-announces it.
    for (let i = 0; i !== 25; ++i) {
      cy.realPress("ArrowLeft");
    }
    assertCoords("(x: -240, y:    0)", "x -240, y 0, left edge");
    cy.get(".CoordsChooserAnnouncer > span").then(($span) => {
      cy.realPress("ArrowLeft");
      cy.get(".CoordsChooserAnnouncer > span").should(($newSpan) => {
        expect($newSpan[0]).not.to.equal($span[0]);
        expect($newSpan.text()).to.equal("x -240, y 0, left edge");
      });
    });

    cy.realPress(" ");
    assertCopiedText("(-240, 0)");

    // Dismissing resets position and clears announcement.
    cy.realPress("Escape");
    cy.get(".CoordsChooserAnnouncer").should("have.text", "");
    cy.pytchChooseDropdownEntry("Show coordinates");
    cy.get(".CoordsChooserBarMessage .coords").should(
      "have.text",
      "(x:    0, y:    0)"
    );
    cy.get("button.close-button").click();
  });

  // TODO: Further tweaks to behaviour:
  // Dismiss chooser if user gives focus to editor?  If user uses
  // "C-return" in editor?  If user uses browser back button to return
  // to "My Projects"?

  const downloadInitiationTestSpecs = [
    { kind: "click" },
    { kind: "enter" },
  ] as const;

  downloadInitiationTestSpecs.forEach((spec) => {
    const fullLabel = `can create a zipfile ready for download (${spec.kind})`;
    it(fullLabel, () => {
      withDownloadedZipfile(spec.kind, async (existingFile) => {
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

        const assetMetadata = await existingFile("assets/metadata.json").async(
          "string"
        );
        expect(assetMetadata.length).greaterThan(0);
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
    cy.get("button.full-screen").click();
    checkTooltipPosition();
  });
});
