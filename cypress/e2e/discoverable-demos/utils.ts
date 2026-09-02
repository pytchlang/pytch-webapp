/// <reference types="cypress" />

import {
  DemoCatalogueEntry,
  zDemoCatalogueEntry,
} from "../../../src/model/discoverable-demos-schema";

// Shared helpers and fixtures for the "discoverable demos" end-to-end
// tests (Layer A — fully mocked).  See `disco-demos-e2e-tests.md`.
//
// The real catalogue lives behind the `VITE_DEMO_CATALOGUE_BASE` env.var
// and is served by a separately-managed process.  To keep these tests
// deterministic we `cy.intercept` every catalogue request and serve the
// in-repo fixtures under `cypress/fixtures/demo-catalogue/`.  The URL
// shapes (from `src/model/discoverable-demos.ts`) are:
//
//   ${BASE}/index/en/demos.json           — the catalogue index
//   ${BASE}/<uuid>/en/metadata.json       — per-demo metadata
//   ${BASE}/<uuid>/en/project.zip         — per-demo project zipfile
//   ${BASE}/<uuid>/en/content/description.md
//   ${BASE}/<uuid>/en/content/thumbnail.png
//   ${BASE}/<uuid>/en/content/thumbnail.mp4
//
// We match on the (base-agnostic) tail of each URL.

function uuidFromUrl(url: string, re: RegExp): string {
  const m = url.match(re);
  if (m == null) {
    throw new Error(`could not extract demo uuid from URL "${url}"`);
  }
  return m[1];
}

/** Install intercepts so that all discoverable-demos catalogue resources
 * are served from `cypress/fixtures/demo-catalogue/`.  Call this before
 * `cy.visit("/demos")` (or before navigating into the IDE for a project
 * linked to a demo). */
export function interceptDemoCatalogue() {
  cy.intercept("GET", "**/index/en/demos.json", {
    fixture: "demo-catalogue/index/en/demos.json",
  }).as("demosIndex");

  cy.intercept("GET", "**/*/en/metadata.json", (req) => {
    const uuid = uuidFromUrl(req.url, /\/([^/]+)\/en\/metadata\.json/);
    req.reply({ fixture: `demo-catalogue/${uuid}/en/metadata.json` });
  });

  cy.intercept("GET", "**/*/en/project.zip", (req) => {
    const uuid = uuidFromUrl(req.url, /\/([^/]+)\/en\/project\.zip/);
    req.reply({ fixture: `demo-catalogue/${uuid}/en/project.zip` });
  });

  cy.intercept("GET", "**/*/en/content/description.md", (req) => {
    const uuid = uuidFromUrl(
      req.url,
      /\/([^/]+)\/en\/content\/description\.md/
    );
    req.reply({ fixture: `demo-catalogue/${uuid}/en/content/description.md` });
  });

  cy.intercept("GET", "**/*/en/content/thumbnail.png", (req) => {
    const uuid = uuidFromUrl(req.url, /\/([^/]+)\/en\/content\/thumbnail\.png/);
    req.reply({ fixture: `demo-catalogue/${uuid}/en/content/thumbnail.png` });
  });

  // Preload each video thumbnail as raw bytes (null = Buffer, no decoding),
  // keyed by uuid. This runs in the command queue, before cy.visit triggers
  // any requests, so the map is populated by the time the app asks for them.
  // Cypress's `req.reply` body supports `ArrayBuffer` for binary, but NOT a
  // Node `Buffer` (a `Uint8Array`): a `Buffer` falls through to the
  // object/JSON path and is serialized as `{"type":"Buffer","data":[...]}`,
  // which the <video> element rejects ("no supported sources").  So convert
  // each fixture's bytes to a standalone `ArrayBuffer` here.
  let videoBytes = new Map<string, ArrayBuffer>();
  cy.fixture("demo-catalogue/index/en/demos.json").then((index) => {
    index
      .map(zDemoCatalogueEntry.parse)
      .filter((e: DemoCatalogueEntry) => e.thumbnailVideoExtension != null)
      .forEach((e: DemoCatalogueEntry) => {
        cy.fixture(
          `demo-catalogue/${e.uuid}/en/content/thumbnail.mp4`,
          null
        ).then((bytes) => {
          videoBytes.set(
            e.uuid,
            bytes.buffer.slice(
              bytes.byteOffset,
              bytes.byteOffset + bytes.byteLength
            )
          );
        });
      });
  });

  cy.intercept("GET", "**/*/en/content/thumbnail.mp4", (req) => {
    const uuid = uuidFromUrl(req.url, /\/([^/]+)\/en\/content\/thumbnail\.mp4/);
    req.reply({
      statusCode: 200,
      headers: { "content-type": "video/mp4" },
      body: videoBytes.get(uuid), // ArrayBuffer — sent as raw binary
    });
  });
}

/** Intercept the catalogue, visit `/demos`, and wait for the index fetch
 * and the header to render. */
export function visitDemosPage() {
  interceptDemoCatalogue();
  cy.visit("/demos/");
  cy.wait("@demosIndex");
  cy.get(".demos-header");
}

/** As `visitDemosPage()`, but first reset the database — for tests which
 * create a project from a demo and then inspect "My projects". */
export function resetAndVisitDemosPage() {
  interceptDemoCatalogue();
  cy.pytchResetDatabase();
  cy.visit("/demos/");
  cy.wait("@demosIndex");
  cy.get(".demos-header");
}

/** Assert that the IDE is showing the demo sidebar (the project is linked
 * to a demo). */
export function assertDemoSidebar() {
  cy.get(".DemoSidebar");
}

// ---------------------------------------------------------------------------
// Facts anchored on the deterministic fixtures.  These are derived from
// `cypress/fixtures/demo-catalogue/index/en/demos.json`; if the fixtures
// are regenerated with materially different content, update these (and
// the Layer-B fixture-validity test will keep the shape honest).

export const kDemosPerPage = 10;
export const kNDemos = 104;
export const kNRecommended = 12;
export const kNPages = Math.ceil(kNDemos / kDemosPerPage); // 11

export const kNGameDemos = 54;
export const kNSnippetDemos = 50;

// The catalogue is ordered (and, by default, sorted) by lastUpdated
// descending, so the newest demo is shown first.
export const kNewestDemoName = "per-method snippet demo 24";

// The first two recommended demos, in lastUpdated-descending order.
export const kFirstRecommendedName = "per-method snippet demo 01";
export const kSecondRecommendedName = "per-method snippet demo 00";

// The 11th demo by lastUpdated — i.e. the first card on page 2.
export const kFirstDemoOnPage2Name = "per-method snippet demo 14";

// A demo with a unique display-name substring, so a search for its full
// name yields exactly one result.  Its project.zip names the project
// after the demo, which we rely on for the "My projects" assertion.
export const kUniqueDemo = {
  uuid: "267f3672-64c9-5573-ba5b-4064c62f188f",
  name: "per-method snippet demo 21",
  programKind: "per-method" as const,
  demoKind: "snippet" as const,
};

// A single-chapter ("mono") demo, which also has a thumbnail video.
export const kMonoDemo = {
  uuid: "52926cab-af7d-57d8-9d91-e8d1b6fc0c45",
  name: "per-method snippet demo 24",
  lastUpdatedPP: "Nov 15, 2023",
  hasVideo: true,
};

// A multi-chapter ("structured") demo with three chapters and no video.
export const kStructuredDemo = {
  uuid: "48efb0e9-bf11-5946-824c-627222047942",
  name: "per-method snippet demo 23",
  nChapters: 3,
  headings: ["Introduction", "Chapter 2", "Chapter 3"],
  hasVideo: false,
};

// ---------------------------------------------------------------------------
// Small selector helpers.

/** The result cards on the demos list.  Only list cards carry a
 * `data-demo-uuid` attribute (the recommended-carousel cards do not), so
 * this reliably scopes to the search-result grid. */
export function demoCards() {
  return cy.get("[data-demo-uuid]");
}

/** Assert (with retry) the number of result cards shown. */
export function demoCardCountShouldBe(n: number) {
  demoCards().should("have.length", n);
}

/** Assert (with retry) that the first result card's title is `name`. */
export function firstCardTitleShouldBe(name: string) {
  demoCards().first().find("h3").should("have.text", name);
}

function cardTitlesOf($els: JQuery<HTMLElement>): string[] {
  return $els.toArray().map((el) => el.innerText.trim());
}

/** Assert (with retry) that the result cards have exactly these titles, in
 * this order. */
export function cardTitlesShouldEqual(expected: Array<string>) {
  cy.get("[data-demo-uuid] h3").should(($els) => {
    expect(cardTitlesOf($els)).to.deep.equal(expected);
  });
}

/** Assert (with retry) that the result cards are in ascending display-name
 * order (using the same `localeCompare` the app uses). */
export function cardTitlesShouldBeAscending() {
  cy.get("[data-demo-uuid] h3").should(($els) => {
    const titles = cardTitlesOf($els);
    expect(titles).to.deep.equal(
      [...titles].sort((a, b) => a.localeCompare(b))
    );
  });
}

/** Click the title link of the unique result card with the given exact
 * display name. */
export function clickDemoCardTitle(name: string) {
  demoCards()
    .find("h3")
    .filter((_i, el) => (el as HTMLElement).innerText.trim() === name)
    .should("have.length", 1)
    .parent()
    .click();
}

/** Type into the search field (live search fires on every keystroke). */
export function typeSearch(term: string) {
  cy.get("#search-field").clear().type(term);
}

// The demo-kind / program-kind / sort-by selectors use `onInput` (not
// `onChange`).  Cypress's `.select()` sets the value and fires `change`;
// we additionally fire `input` so the React handler runs.
export function selectDemoKind(value: "all" | "game" | "snippet") {
  cy.get("select.project-type").select(value).trigger("input");
}

export function selectProgramKind(value: "all" | "flat" | "per-method") {
  cy.get('select[aria-label="Program type"]').select(value).trigger("input");
}

export function selectSortBy(value: "last-updated" | "alphabet-asc") {
  cy.get('select[aria-label="Sort by"]').select(value).trigger("input");
}
