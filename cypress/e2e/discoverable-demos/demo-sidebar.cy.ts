/// <reference types="cypress" />

// §9 Demo sidebar — single-chapter ("mono") demo
// §10 Demo sidebar — multi-chapter ("structured") demo
// §11.57 Markdown in chapters is rendered, not shown as raw source
// §11.58 The hard-coded "en" language segment is exercised

import { assertFocus, invokeFocusShortcut } from "../keyboard-navigation/utils";
import {
  interceptDemoCatalogue,
  resetAndVisitDemosPage,
  assertDemoSidebar,
  demoCardCountShouldBe,
  typeSearch,
  clickDemoCardTitle,
  kMonoDemo,
  kStructuredDemo,
} from "./utils";

// --- sidebar selector helpers (used across the tests in this file) ---

function chapterPillShouldContain(text: string) {
  cy.get(".DemoSidebar .chapter-pill").should("contain", text);
}

function chapterHeadingShouldContain(text: string) {
  cy.get(".DemoSidebar .chapter-heading").should("contain", text);
}

function navCaret() {
  return cy.get(".DemoSidebar #nav-caret");
}

function clickNextChapter() {
  cy.get(".DemoSidebar .next-chapter").click();
}

function clickPrevChapter() {
  cy.get(".DemoSidebar .prev-chapter").click();
}

/** Reset the database, open `/demos`, and create a project from the
 * demo matchin the given `name` (which should be specific enough to get
 * the demo the test wants), landing in the IDE with its Demo sidebar.
 * */
function openDemoInIde(name: string) {
  resetAndVisitDemosPage();
  clickDemoCardTitle(name);
  assertDemoSidebar();
}

context("Demo sidebar — single-chapter (mono) demo", () => {
  beforeEach(() => {
    openDemoInIde(kMonoDemo.name);
  });

  // §9.42 — name, summary subheader, "Published on <date>" footer.
  it("shows the demo name, summary and published date", () => {
    cy.get(".DemoSidebar .demo-header h1").should("have.text", kMonoDemo.name);
    cy.get(".DemoSidebar .demo-sub-header").should(
      "contain",
      "Summary of bulk/per-method-snippet-24"
    );
    cy.get(".DemoSidebar .demo-footer").should(
      "contain",
      `Published on ${kMonoDemo.lastUpdatedPP}`
    );
  });

  // §9.43 — mono header: no chapter-count pill, no nav caret, and the
  //         chapter heading has no leading "<index>." number.
  it("uses the mono header with no chapter pill, caret or number", () => {
    cy.get(".DemoSidebar .chapter-pill").should("not.exist");
    cy.get(".DemoSidebar #nav-caret").should("not.exist");
    chapterHeadingShouldContain("Introduction");
    cy.get(".DemoSidebar .chapter-heading").should("not.contain", "1.");
  });

  // §11.57
  it("renders demo-summary markdown content", () => {
    cy.get(".DemoSidebar .demo-sub-header strong").should("contain", "short");
    cy.get(".DemoSidebar .demo-sub-header em").should("contain", "snappy");
  });

  // §9.44  — the single chapter's markdown content is rendered
  //                  (the bold span proves Markdown→HTML, not raw source).
  it("renders the chapter markdown content", () => {
    cy.get(".DemoSidebar .chapter-markdown").should("contain", "This is the");
    cy.get(".DemoSidebar .chapter-markdown strong").should(
      "contain",
      "Add bulk demo per-method-snippet-24"
    );
  });
});

context("Demo sidebar — multi-chapter (structured) demo", () => {
  beforeEach(() => {
    openDemoInIde(kStructuredDemo.name);
  });

  const n = kStructuredDemo.nChapters;

  // §10.45 — structured header: chapter-count pill 1/N and the nav caret.
  it("uses the structured header with a 1/N pill and a nav caret", () => {
    chapterPillShouldContain(`1/${n}`);
    navCaret().should("exist");
  });

  // §10.46 — the chapters navigation is expanded by default (nChapters > 1).
  it("expands the chapters navigation by default", () => {
    navCaret().should("have.class", "isNavigationExpanded");
    cy.get(".DemoSidebar .chapters-list").should("be.visible");
  });

  // §10.47 — the nav caret collapses/expands the chapters list, and focus
  //          returns to the caret button.
  it("collapses and expands the chapters list via the caret", () => {
    navCaret().click();
    navCaret().should("not.have.class", "isNavigationExpanded");
    cy.focused().should("have.id", "nav-caret");

    navCaret().click();
    navCaret().should("have.class", "isNavigationExpanded");
  });

  // §10.48 / §10.51 — clicking a chapter heading sets it active: pill k/N,
  //                   content switches, heading highlighted; and the heading
  //                   shows a leading "<index>." number (because N > 1).
  it("activates a chapter when its heading is clicked", () => {
    chapterHeadingShouldContain("1.");

    // Activate the second chapter ("Chapter 2", index 1).
    cy.get(".DemoSidebar .chapters-list li button").eq(1).click();

    chapterPillShouldContain(`2/${n}`);
    chapterHeadingShouldContain("2.");
    chapterHeadingShouldContain("Chapter 2");
    cy.get(".DemoSidebar .chapter-markdown").should("contain", "(part 2)");
    cy.get(".DemoSidebar .chapters-list li button.active").should(
      "contain",
      "Chapter 2"
    );
  });

  // §10.49 — "Next chapter" advances and wraps from the last back to the first.
  it("advances and wraps with the Next chapter button", () => {
    chapterPillShouldContain(`1/${n}`);
    clickNextChapter();
    chapterPillShouldContain(`2/${n}`);
    clickNextChapter();
    chapterPillShouldContain(`3/${n}`);
    clickNextChapter(); // wrap
    chapterPillShouldContain(`1/${n}`);
  });

  // §10.50 — "Previous chapter" goes back and wraps from the first to the last.
  it("goes back and wraps with the Previous chapter button", () => {
    chapterPillShouldContain(`1/${n}`);
    clickPrevChapter(); // wrap to last
    chapterPillShouldContain(`${n}/${n}`);
    clickPrevChapter();
    chapterPillShouldContain(`${n - 1}/${n}`);
  });

  // §10.52 — keyboard navigation within the chapters list (Arrow keys move
  //          between headings).
  it("moves between chapter headings with the arrow keys", () => {
    cy.get(".DemoSidebar .chapters-list li button").eq(0).focus();
    cy.focused().type("{downArrow}");
    cy.focused().should("contain", "Chapter 2");
    cy.focused().type("{upArrow}");
    cy.focused().should("contain", "Introduction");
  });

  // §10.53 — keyboard navigation between the prev/next chapter buttons.
  it("moves focus between the prev/next chapter buttons with arrow keys", () => {
    cy.get(".DemoSidebar .prev-chapter").focus().type("{rightArrow}");
    cy.focused().should("have.class", "next-chapter");
    cy.focused().type("{leftArrow}");
    cy.focused().should("have.class", "prev-chapter");
  });

  // §10.54 — switching to a different demo resets the active chapter to 0 and
  //          the nav-expanded state for the new demo's chapter count.
  it("resets the active chapter when opening a different demo", () => {
    // Advance within the structured demo first.
    clickNextChapter();
    chapterPillShouldContain(`2/${n}`);

    // Open the mono demo; it must start at chapter 0 with the mono header.
    interceptDemoCatalogue();
    cy.visit("/demos/");
    cy.wait("@demosIndex");
    typeSearch(kMonoDemo.name);
    demoCardCountShouldBe(1);
    clickDemoCardTitle(kMonoDemo.name);

    cy.get(".DemoSidebar .chapter-pill").should("not.exist");
    chapterHeadingShouldContain("Introduction");
  });

  it("focuses content with global shortcut", () => {
    invokeFocusShortcut("h");
    assertFocus("demo-info");
  });
});

// §11.58 — the hard-coded "en" language segment is exercised.  All of the
// intercepts above match `**/<uuid>/en/...`; this test makes that explicit
// by asserting the catalogue index is fetched from the "/index/en/" path.
context("Demo sidebar — resource URL language segment", () => {
  it('fetches the catalogue from the "en" language path', () => {
    interceptDemoCatalogue();
    cy.visit("/demos/");
    cy.wait("@demosIndex").its("request.url").should("include", "/index/en/");
  });
});
