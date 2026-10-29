/// <reference types="cypress" />

// §1 Demos list page — loading and fetch states
// §2 Recommended carousel
// §11.55 Catalogue load is independent of the user's projects

import {
  interceptDemoCatalogue,
  visitDemosPage,
  demoCards,
  demoCardCountShouldBe,
  kNRecommended,
  kFirstRecommendedName,
  kSecondRecommendedName,
  kNewestDemoName,
} from "./utils";

function recommendedIndicatorShouldContain(text: string) {
  cy.get(".demos-recommended").contains(text);
}

function activeRecommendedTitleShouldBe(name: string) {
  cy.get(".demos-recommended .carousel-item.active h3").should(
    "have.text",
    name
  );
}

context("Discoverable demos — list page loading and fetch states", () => {
  // §1.1 / §1.2 — spinner while requesting, then content once available.
  it("shows a spinner while loading, then the content", () => {
    // Register the standard intercepts first, then override the index
    // with a delayed reply (the most-recently-registered intercept wins).
    interceptDemoCatalogue();
    cy.intercept("GET", "**/index/all-demos.json", (req) => {
      req.reply({
        fixture: "demo-catalogue/index/all-demos.json",
        delay: 1000,
      });
    }).as("slowIndex");

    cy.visit("/demos/");

    // The results and recommended areas both show a spinner while idle /
    // requesting.
    cy.get(".spinner-container").should("exist");
    cy.get(".DemoCard, [data-demo-uuid]").should("not.exist");

    cy.wait("@slowIndex");

    // Once available the header, recommended carousel, search controls
    // and result cards are shown, and the spinners are gone.
    cy.get(".demos-header");
    cy.get(".demos-recommended");
    cy.get("#search-field");
    demoCardCountShouldBe(10);
    cy.get(".spinner-container").should("not.exist");
  });

  // §1.3 — results area error copy.
  it("shows error message if the catalogue fetch fails", () => {
    cy.intercept("GET", "**/index/all-demos.json", { statusCode: 500 }).as(
      "failedIndex"
    );

    cy.visit("/demos/");
    cy.wait("@failedIndex");

    // Results area.
    cy.get(".DemosList").contains("Sorry, there was a problem fetching");
    cy.get(".DemosList").contains("Catalogue of demos");

    demoCards().should("not.exist");
  });

  // §1.5 — document title.
  it("sets the document title to 'Pytch: Demos'", () => {
    visitDemosPage();
    cy.title().should("eq", "Pytch: Demos");
  });

  // §1.6 — reachable from the nav banner's Explore dropdown.
  it("is reachable from the nav banner", () => {
    interceptDemoCatalogue();
    cy.visit("/");
    cy.contains("Explore").click();
    cy.get(".dropdown-menu").contains("Demos").click();
    cy.wait("@demosIndex");
    cy.get(".demos-header");
    demoCardCountShouldBe(10);
  });

  // §11.55 — works with an empty project database.
  it("loads independent of user's projects (empty IndexedDB)", () => {
    interceptDemoCatalogue();
    cy.pytchResetDatabase();
    cy.visit("/demos/");
    cy.wait("@demosIndex");
    cy.get(".demos-header");
    demoCardCountShouldBe(10);
  });
});

context("Discoverable demos — recommended carousel", () => {
  beforeEach(() => {
    visitDemosPage();
  });

  // §2.7 — only recommended:true demos appear.
  it("shows only recommended demos", () => {
    cy.get(".demos-recommended .recommended-card h3").should(
      "have.length",
      kNRecommended
    );
    // A known non-recommended demo must not appear in the carousel.
    cy.get(".demos-recommended").should("not.contain", kNewestDemoName);
    activeRecommendedTitleShouldBe(kFirstRecommendedName);
  });

  // §2.8 — position indicator reads 1/N initially.
  it("shows the 1/N position indicator", () => {
    recommendedIndicatorShouldContain(`1/${kNRecommended}`);
  });

  // §2.9 — advancing updates the active slide and the indicator.
  it("advances on the next control", () => {
    cy.get(".demos-recommended .carousel-control-next").click();
    recommendedIndicatorShouldContain(`2/${kNRecommended}`);
    activeRecommendedTitleShouldBe(kSecondRecommendedName);
  });
});
