/// <reference types="cypress" />

// §3 Search by term
// §4 Filtering (demo kind, program kind) and sorting
// §5 Pagination

import {
  visitDemosPage,
  demoCards,
  demoCardCountShouldBe,
  cardTitlesShouldEqual,
  cardTitlesShouldBeAscending,
  firstCardTitleShouldBe,
  typeSearch,
  selectDemoKind,
  selectProgramKind,
  selectSortBy,
  kDemosPerPage,
  kNPages,
  kNewestDemoName,
  kFirstDemoOnPage2Name,
  kUniqueDemo,
} from "./utils";

function eachCardHasDemoKind(label: "Game" | "Snippet") {
  demoCards().each(($card) => {
    cy.wrap($card).find(".pill-demo-kind").should("have.text", label);
  });
}

function eachCardHasProgramKind(alt: "flat project" | "per-method project") {
  demoCards().each(($card) => {
    cy.wrap($card).find(`img[alt='${alt}']`).should("exist");
  });
}

function pageItems() {
  return cy.get(".pagination .page-item");
}

// The active page item's text includes a visually-hidden "(current)".
function activePageShouldBe(page: number) {
  cy.get(".pagination .page-item.active")
    .invoke("text")
    .should("match", new RegExp(`^${page}\\b`));
}

context("Discoverable demos — search by term", () => {
  beforeEach(() => {
    visitDemosPage();
  });

  // §3.12 — substring, case-insensitive match on displayName.
  it("filters cards by case-insensitive substring of the name", () => {
    // "snippet demo 24" matches the flat and per-method snippet #24 demos.
    typeSearch("SNIPPET demo 24");
    cardTitlesShouldEqual([
      "per-method snippet demo 24",
      "flat snippet demo 24",
    ]);
  });

  // §3.13 — live search as characters are typed.
  it("narrows results live while typing", () => {
    typeSearch("per-method snippet demo 2");
    demoCardCountShouldBe(5); // 20..24
    cy.get("#search-field").type("1");
    demoCardCountShouldBe(1);
    cardTitlesShouldEqual([kUniqueDemo.name]);
  });

  // §3.14 — no search button; decorative icon; accessible names.
  it("has accessible search controls and no search button", () => {
    cy.get("#search-button").should("not.exist");
    cy.get(".search-icon svg").should("have.attr", "aria-hidden", "true");
    cy.get("label[for='search-field']").should("have.text", "Search");
    cy.get("#search-field").should("have.attr", "type", "search");
    cy.get("select.project-type").should(
      "have.attr",
      "aria-label",
      "Demo type"
    );
  });

  // §3.15 — no matches shows the "No demos found." message.
  it("shows the no-results message for a term matching nothing", () => {
    typeSearch("definitely-no-such-demo");
    cy.get(".no-results").should("contain", "No demos found.");
    demoCards().should("not.exist");
  });

  // §3.16 — clearing the term restores the full result set.
  it("restores all results when the term is cleared", () => {
    typeSearch(kUniqueDemo.name);
    demoCardCountShouldBe(1);
    cy.get("#search-field").clear();
    demoCardCountShouldBe(kDemosPerPage);
  });

  // §3.17 — the search field keeps focus across searches.
  it("keeps focus in the search field after searching", () => {
    typeSearch("game");
    cy.focused().should("have.id", "search-field");
  });
});

context("Discoverable demos — filtering and sorting", () => {
  beforeEach(() => {
    visitDemosPage();
  });

  // §4.18 — demo-kind selector.
  it("filters by demo kind", () => {
    selectDemoKind("game");
    eachCardHasDemoKind("Game");
    selectDemoKind("snippet");
    eachCardHasDemoKind("Snippet");
    selectDemoKind("all");
    cy.get("select.project-type").should("have.value", "all");
  });

  // §4.19 — program-kind selector.
  it("filters by program kind", () => {
    selectProgramKind("flat");
    eachCardHasProgramKind("flat project");
    selectProgramKind("per-method");
    eachCardHasProgramKind("per-method project");
  });

  // §4.20 — demo-kind and program-kind filters combine (AND) with search.
  it("combines demo-kind, program-kind and search filters", () => {
    typeSearch("demo 0");
    selectDemoKind("game");
    selectProgramKind("flat");
    eachCardHasDemoKind("Game");
    eachCardHasProgramKind("flat project");
    demoCards().each(($card) => {
      cy.wrap($card).find("h3").invoke("text").should("contain", "demo 0");
    });
  });

  // §4.21 — sorting.
  it("sorts A-to-Z and by Last Updated", () => {
    selectSortBy("alphabet-asc");
    cardTitlesShouldBeAscending();

    selectSortBy("last-updated");
    firstCardTitleShouldBe(kNewestDemoName); // newest first
  });

  // §4.22 — clicking a card's program-kind pill sets that filter.
  it("applies the program-kind filter from a card pill", () => {
    // Newest card is a per-method demo.
    demoCards().first().find(".pill-icon").click();
    cy.get('select[aria-label="Program type"]').should(
      "have.value",
      "per-method"
    );
    eachCardHasProgramKind("per-method project");
  });

  // §4.23 — clicking a card's demo-kind pill sets that filter.
  it("applies the demo-kind filter from a card pill", () => {
    // Newest card is a snippet demo.
    demoCards().first().find(".pill-demo-kind").click();
    cy.get("select.project-type").should("have.value", "snippet");
    eachCardHasDemoKind("Snippet");
  });

  // §4.24 — a filter change keeps an active search term.
  it("keeps the search term when a filter changes", () => {
    typeSearch("snippet");
    selectDemoKind("game");
    cy.get("#search-field").should("have.value", "snippet");
    // game + "snippet" substring => nothing.
    cy.get(".no-results").should("exist");
  });
});

context("Discoverable demos — pagination", () => {
  beforeEach(() => {
    visitDemosPage();
  });

  // §5.25 — more than one page of results.
  it("shows only the first page and a pagination control", () => {
    demoCardCountShouldBe(kDemosPerPage);
    pageItems().should("exist");
    cy.get(".pagination").contains(`${kNPages}`);
  });

  // §5.26 — navigating to page 2.
  it("shows the next slice of demos on page 2", () => {
    pageItems().contains("2").click();
    demoCardCountShouldBe(kDemosPerPage);
    firstCardTitleShouldBe(kFirstDemoOnPage2Name);
  });

  // §5.27 — a single page of results has no page buttons.
  it("renders no page buttons for a single page of results", () => {
    typeSearch(kUniqueDemo.name);
    demoCardCountShouldBe(1);
    pageItems().should("not.exist");
  });

  // §5.28 — changing the search while on a later page returns to page 1.
  it("returns to page 1 when the search term changes", () => {
    pageItems().contains("2").click();
    firstCardTitleShouldBe(kFirstDemoOnPage2Name);

    // Narrow to two results while on page 2.
    typeSearch("snippet demo 22");
    cardTitlesShouldEqual([
      "per-method snippet demo 22",
      "flat snippet demo 22",
    ]);
    cy.get(".no-results").should("not.exist");
  });

  it("returns to page 1 when a filter or the sort order changes", () => {
    pageItems().contains("2").click();
    firstCardTitleShouldBe(kFirstDemoOnPage2Name);
    selectSortBy("alphabet-asc");
    activePageShouldBe(1);

    pageItems().contains("2").click();
    selectProgramKind("flat");
    activePageShouldBe(1);

    pageItems().contains("2").click();
    selectDemoKind("snippet");
    activePageShouldBe(1);
  });
});
