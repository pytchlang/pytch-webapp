/// <reference types="cypress" />

// §7 Demo card presentation
// §8 Keyboard / focus navigation on the list (activation is covered in
//    create-from-demo.cy.ts, cross-ref §32/§41)

import { DemoKind } from "../../../src/model/discoverable-demos-schema";
import { assertNever } from "../../../src/utils";
import {
  visitDemosPage,
  demoCards,
  demoCardCountShouldBe,
  typeSearch,
  kMonoDemo,
  kStructuredDemo,
} from "./utils";

function cardVideoShowing() {
  return cy.get("[data-demo-uuid] video.showVideo");
}

context("Discoverable demos — card presentation", () => {
  beforeEach(() => {
    visitDemosPage();
  });

  function assertCardDetails(expDemoKind: DemoKind) {
    const expDisplayName = expDemoKind === "game" ? "Game" : "Snippet";
    cy.get(".pill-demo-kind").should("have.text", expDisplayName);
    switch (expDemoKind) {
      case "game":
        cy.get(".pill-demo-kind.isSnippet").should("not.exist");
        cy.get(".pill-demo-kind.isGame").should("exist");
        break;
      case "snippet":
        cy.get(".pill-demo-kind.isSnippet").should("exist");
        cy.get(".pill-demo-kind.isGame").should("not.exist");
        break;
      default:
        assertNever(expDemoKind);
    }
  }

  // §7.35 — name, summary, formatted date, demo-kind pill, program-kind icon.
  // §7.36 — demo-kind pill styling class.
  it("shows the card's details", () => {
    typeSearch(kMonoDemo.name); // a per-method snippet demo
    demoCardCountShouldBe(1);

    demoCards().within(() => {
      cy.get("h3").should("have.text", kMonoDemo.name);
      cy.get(".demo-description").should(
        "contain",
        "Summary of bulk/per-method-snippet-24"
      );
      cy.contains(kMonoDemo.lastUpdatedPP); // "PP" date format
      assertCardDetails("snippet");
      cy.get(".pill-icon img[alt='per-method project']").should("exist");
    });
  });

  it("uses the isGame styling class for a game demo", () => {
    typeSearch("per-method game demo 24");
    demoCardCountShouldBe(1);
    demoCards().within(() => assertCardDetails("game"));
  });

  // §7.37 — hovering a card with a video swaps image for video.
  it("swaps the thumbnail for the video on hover (demo with video)", () => {
    expect(kMonoDemo.hasVideo).to.equal(true);
    typeSearch(kMonoDemo.name);
    demoCardCountShouldBe(1);

    // A <video> element exists but is not shown until hover.
    demoCards().find("video").should("exist");
    cardVideoShowing().should("not.exist");
    demoCards().find("img.showImage").should("exist");

    demoCards().trigger("mouseover");
    cardVideoShowing().should("exist");
    demoCards().find("img.showImage").should("not.exist");

    demoCards().trigger("mouseout");
    cardVideoShowing().should("not.exist");
  });

  // §7.38 — a card without a video only ever shows the image.
  it("never shows a video for a demo without one", () => {
    expect(kStructuredDemo.hasVideo).to.equal(false);
    typeSearch(kStructuredDemo.name);
    demoCardCountShouldBe(1);

    demoCards().find("video").should("not.exist");
    demoCards().find("img.thumbnail-bg").should("exist");

    demoCards().trigger("mouseover");
    demoCards().find("video").should("not.exist");
  });
});

context("Discoverable demos — keyboard / focus on the list", () => {
  beforeEach(() => {
    visitDemosPage();
  });

  // §8.39 — arrow keys move focus between cards.
  it("moves focus between cards with the arrow keys", () => {
    demoCards().first().focus();
    cy.focused()
      .invoke("attr", "data-demo-uuid")
      .then((firstUuid) => {
        cy.focused().type("{downArrow}");
        cy.focused()
          .should("have.attr", "data-demo-uuid")
          .and("not.equal", firstUuid);
      });
  });

  // §8.40 — pills inside cards are skipped in tab order (tabIndex=-1).
  it("gives card pills tabIndex -1 so they are skipped", () => {
    demoCards()
      .first()
      .within(() => {
        cy.get(".pill-icon").should("have.attr", "tabindex", "-1");
        cy.get(".pill-demo-kind").should("have.attr", "tabindex", "-1");
      });
  });
});
