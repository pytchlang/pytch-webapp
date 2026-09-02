# End-to-end test scenarios for Discoverable Demos

This document lists scenarios that should be covered by Cypress end-to-end
tests for the "discoverable demos" feature. The feature comprises:

- The **Demos list page** at route `/demos`
  (`src/components/discoverable-demos-page/DemosList.tsx` and siblings:
  `DemoCard`, `RecommendedDemos`, `DemoThumbnailContent`,
  `CreateProjectFromDemoModal`).
- The **Demo sidebar** shown inside the IDE when a project is linked to a
  demo (`src/components/demo-sidebar/`: `DemoSidebar`, `DemoHeader`,
  `ChaptersOverview`, `DemoChapter`).
- The supporting model/flow code: `src/model/discoverable-demos.ts` and
  `src/model/project-from-demo-flow.ts`.

Note that this functionality is entirely separate from the "suggested
demo" functionality.  The tests for the "suggested demo" flow will not
be helpful for writing the new tests for the "discoverable demos"
feature.

## General environment

This repo is part of a larger project.  That larger project takes care
of launching a variety of `localhost` servers and setting the various
environment variables which this React app uses.  You may assume that
the required URLs will in fact resolve to a live local server when the
tests run.  These URLs include those identified by the env.vars

``` shell
VITE_SKULPT_BASE
VITE_TUTORIALS_BASE
VITE_DEMOS_BASE
VITE_DEMO_CATALOGUE_BASE
VITE_STATIC_BLOBS_BASE
VITE_MEDIALIB_BASE
VITE_LESSON_SPECIMENS_BASE
```

## Test-infrastructure notes

These are not scenarios, but things the tests will need (mostly absent
today, so flagged here to scope the work):

- The catalogue index is fetched from
  `${VITE_DEMO_CATALOGUE_BASE}/index/en/demos.json` (see
  `demosIndexUrl`).  For normal development work, this is made
  available by a separately-managed server process.  E2e tests will
  need to intercept fetches of this and related URLs.
- Per-demo resources are derived from the entry: thumbnail image
  (`content/thumbnail<ext>`), optional thumbnail video, `project.zip`,
  `metadata.json`, `content/description.md`.
- Most assertions key off existing ids/classes: `#search-field`,
  `#search-button`, `.project-type` select, `.DemosList`, `.demos-header`,
  `.demos-recommended`, `.DemoCard`/`.card`, `.pill-icon`,
  `.pill-demo-kind`, `.no-results`, the pagination provider, and in the
  sidebar `.DemoSidebar`, `.demo-header`, `.chapter-pill`, `#nav-caret`,
  `.chapters-list`, `.prev-chapter`, `.next-chapter`.

## Test-data strategy

The scenarios below assert on specific demos — names, ordering, the
`recommended` flag, demo/program kinds, chapter counts, and so on.  Those
assertions need data that is both **deterministic** (so tests don't flake
as the catalogue changes) and **faithful** (so tests don't pass against a
shape the real server no longer serves).  Relying on the live
separately-managed server gives fidelity but not determinism; pure mocks
give determinism but risk silently diverging from reality.

Resolve this by separating the two concerns into layers rather than asking
any single test to do both.  The bridge between them is the existing Zod
schema (`zDemoCatalogue` / `zDemoCatalogueEntry` in
`src/model/discoverable-demos.ts`), which is the machine-checkable contract
for the catalogue shape.

The distinction that drives everything: **structural** divergence (a field
renamed/removed, the `index/en/demos.json` URL layout changed, the
`description.md` heading convention altered) breaks correctness and must be
caught; **content** divergence (different demos, names, counts) is volatile
and should not be asserted on at all.  Mocks only expose you to structural
divergence, so the job reduces to catching structural drift cheaply, in one
place, against real data.

### Layer A — broad behavioural E2E, fully mocked

Run essentially all of the scenarios below against in-repo fixtures via
`cy.intercept`, so they are deterministic and fast.  This layer owns the
behaviour coverage: loading/error states, search, filtering, sorting,
pagination, the create-project flow, and the sidebar.  See the existing
`interceptDemoZipfile` helper and `cypress/fixtures/project-zipfiles/` for
the established pattern (currently used by the separate "suggested demo"
flow); the catalogue index and per-demo resources need equivalent
intercepts adding.

Fixtures:

- A catalogue `demos.json` covering the cases the scenarios need: a known
  number of `recommended: true` entries; a mix of `demoKind`
  (`game`/`snippet`) and `programKind` (`flat`/`per-method`); known
  `displayName`s and `lastUpdated` dates so substring-search, A-to-Z and
  Last-Updated ordering are assertable; and more than `kDemosPerPage` (10)
  entries so pagination can be exercised.
- Per-demo resources for any demo the tests open: `metadata.json`,
  `project.zip`, `content/description.md`, and a thumbnail (plus a video
  for the hover/preview scenarios, and at least one demo *without* a video
  for the negative case).
- For the sidebar (§9/§10), at least one **single-chapter** and one
  **multi-chapter** demo.  Chapters come from `content/description.md`
  parsed by `src/model/demo-sidebar.ts` (headings are `# ` lines), so the
  fixture markdown must follow that convention to yield the intended
  chapter count.

### Layer B — fixture-validity check (no network)

A unit/integration test that runs every catalogue fixture through
`zDemoCatalogue.parse()`, and every `description.md` fixture through the
chapter parser in `src/model/demo-sidebar.ts`.  This guarantees a fixture
can never drift from the shape the app itself expects, closing the "my mock
is internally bogus" gap for free.

### Layer C — live contract smoke test (thin, content-agnostic)

A small number of tests that hit the **real** server and assert *only
structure*, never specific content:

- `${VITE_DEMO_CATALOGUE_BASE}/index/en/demos.json` fetches and
  `zDemoCatalogue.parse()` succeeds.
- The documented per-resource URLs resolve for at least one entry:
  `metadata.json` (and `zDemoCatalogueEntry.parse()` succeeds on it),
  `project.zip`, `content/description.md`, and a thumbnail.
- A real `project.zip` is accepted by `projectDescriptor`, and a real
  `description.md` parses into ≥1 chapter.

No assertions on names, counts, or ordering.  This is the only layer
coupled to the other server, and it fails loudly and specifically the
moment the *shape* drifts — which is exactly the signal mocks would
otherwise hide.  Because hitting a live server is inherently a little
flaky, run this off the PR critical path (e.g. a nightly or
content-repo-triggered job) so a transient blip never blocks a feature PR.

### Supporting practices

- **Generate fixtures from description.**  The fixtures are generated
  from a tool in the `pytch-demo-catalogue-build-tool` repo, driven by
  a YAML file in that repo.

- **Home of the contract.**  The source of truth for the structure of
  the catalogue-entries is in this repo, i.e., the
  `zDemoCatalogueEntry` and related objects and types.  A tool here
  generates an OpenAPI spec document, which tools within the
  `pytch-demo-catalogue-build-tool` repo refer to.

- **Version the resource URL path.**  Not (yet?) done.  We are in
  control of both producer and consumer, so can upgrade them at the
  same time when required.

---

## 1. Demos list page — loading and fetch states

1. Visiting `/demos` triggers the catalogue fetch and shows a loading
   spinner while the fetch state is `idle`/`requesting`.
2. Once the catalogue is `available`, the spinner is replaced by the demos
   header, recommended carousel, search controls and result cards.
3. If the catalogue fetch fails (intercept returns 500 / network error),
   the results area shows the "Problem" / "Sorry, there was a problem
   fetching the demos information." message and no cards.
4. (Removed.)
5. The document title is set to "Pytch: Demos" when on the page.
6. Navigating to `/demos` from elsewhere (e.g. via the nav banner / front
   page link) reaches the page and loads content.

## 2. Recommended carousel

7. Only demos with `recommended: true` appear in the Recommended carousel.
8. The position indicator reads `1/N` initially, where N is the number of
   recommended demos.
9. Advancing the carousel (next control / keyboard) updates the active slide
   and the `current/total` indicator.
10. Clicking a recommended demo's title link starts the "create project
    from demo" flow (covered in §6) and navigates to the IDE.
11. Hovering a recommended card swaps its thumbnail image for the preview
    video when the demo has a `thumbnailVideoExtension`, and leaves the
    image in place when it does not.

## 3. Search by term

12. Typing a term into `#search-field` filters cards to those whose
    `displayName` contains the term (case-insensitive substring match).
13. Search updates live as characters are typed (no need to press the
    search button) — the result set narrows on each input event.
14. Clicking `#search-button` performs/repeats the search.
15. A term matching nothing shows the "No demos found." message (`.no-results`)
    and no cards.
16. Clearing the search term restores the full result set.
17. The search input keeps focus across searches (the field re-focuses after
    results update) — caret/typing continuity is preserved.

## 4. Filtering (demo kind, program kind) and sorting

18. Selecting "Game" / "Snippet" in the demo-kind (`.project-type`) selector
    restricts results to that `demoKind`; "All" restores everything.
19. Selecting "Flat" / "Per-method" in the program-type selector restricts
    results to that `programKind`; "Program type"/"all" restores everything.
20. Demo-kind and program-kind filters combine (AND) with each other and
    with the search term.
21. Sort "A to Z" orders cards by `displayName` ascending; "Last Updated"
    orders by `lastUpdated` descending. Assert the actual card order.
22. Clicking a card's **program-kind pill** ("flat"/"per-method") sets
    the program-kind filter to that card's kind and re-runs the search
    (results restricted accordingly, and the program-type selector
    reflects the new value).
23. Clicking a card's **demo-kind pill** ("Game"/"Snippet") sets the
    demo-kind filter to that card's kind and re-runs the search.
24. A filter/sort change combined with an active search term keeps the term
    applied (controls don't reset each other).

## 5. Pagination

25. With more than `kDemosPerPage` (10) matching demos, only the first 10
    cards are shown and a pagination control appears.
26. Navigating to page 2 shows the next slice of demos.
27. With 10 or fewer results the pagination behaves correctly (single page).
28. **Edge case worth a regression test:** narrowing the result set via
    search/filter while on a later page. `activePage` is local state and is
    *not* reset when results change, so a previously-page-2 view can show an
    empty page. Confirm intended behaviour (and guard against a blank page).
    **TODO: Fix; useful behaviour is probably to clamp to last page, if the
    number of pages changes.**

## 6. Creating a project from a demo

29. Clicking a demo card's title link (or the recommended card link) runs
    `createProjectFromDemoFlow`: shows the `GenericWorkingModal` while
    working, then navigates to `/ide/:projectId` with the new project open.
30. The created project is linked to the demo (`linkedContentRef` kind
    "demo"), so the IDE opens with the **Demo sidebar** visible.
31. The created project appears in "My projects" with the demo's name.
32. Activating a card via **keyboard** (focus the card, press Enter/Space)
    starts the same create-project flow.
33. If the demo `project.zip` fetch fails, show an error.
34. Abandoning navigation mid-flow (the `NavigationAbandonmentGuard` path):
    navigating away before project creation completes does not create a stray
    project or leave a stuck modal.  **TODO: The test does not properly test for
    this; need to use back/forward.**

## 7. Demo card presentation

35. Each card shows the demo's display name, summary text, formatted
    "last updated" date, demo-kind pill label ("Game"/"Snippet"), and
    program-kind icon with correct `alt` ("flat project" / "per-method
    project").
36. The demo-kind pill carries the right styling class (`isGame` /
    `isSnippet`).
37. Hovering a card (or focusing it via keyboard) swaps the thumbnail image
    for the preview video when one exists, and resets/plays the video from
    the start; moving away restores the image.
38. A card whose demo has no `thumbnailVideoExtension` only ever shows the
    image, including on hover/focus.

## 8. Keyboard / focus navigation on the list

39. Arrow-key navigation moves focus between demo cards within the
    `FocusGroupContainer`, scrolling the focused card into view.
40. Tab order reaches the search field, selectors and search button as
    expected; pills inside cards are skipped (`tabIndex={-1}`).
41. Keyboard activation of a focused card creates the project (=§32).

## 9. Demo sidebar in the IDE — single-chapter ("mono") demo

42. Opening a project linked to a **single-chapter** demo shows the
    `DemoSidebar` with the demo name, summary subheader, and
    "Published on *date*" footer.
43. For a single-chapter demo the header is the "mono" variant: no chapter
    count pill, no expand/collapse nav caret, and the chapter heading shows
    no leading "1." number.
44. The chapter markdown content renders (Markdown → HTML) for the single
    chapter.

## 10. Demo sidebar — multi-chapter ("structured") demo

45. Opening a project linked to a **multi-chapter** demo shows the
    structured header: chapter-count pill reading `1/N`, and the
    expand/collapse nav caret (`#nav-caret`).
46. The chapters navigation is expanded by default when `nChapters > 1`.
47. Clicking the nav caret collapses/expands the chapters list and toggles
    its caret styling; focus returns to the caret button.
48. Clicking a chapter heading in the list sets it active: the chapter pill
    updates to `k/N`, the chapter content switches, and the active heading
    is highlighted/scrolled into view.
49. The "Next chapter" button advances the active chapter and **wraps**
    from the last chapter back to the first.
50. The "Previous chapter" button goes back and **wraps** from the first
    chapter to the last.
51. The chapter heading shows the leading "*index*." number.
52. Keyboard navigation in the chapters list (Arrow Up/Down/Left/Right moves
    between headings; Enter focuses the active chapter button) behaves as
    coded.
53. Keyboard navigation between the prev/next chapter buttons (arrow keys
    move focus between them) behaves as coded.
54. Switching to a different demo (or reopening) resets the active chapter to
    0 and the nav-expanded state according to the new demo's chapter count
    (guards against starting on a non-existent chapter).

## 11. Cross-cutting / regression

55. Loading the demos catalogue is independent of the user's existing
    projects — the page works with an empty project database.
56. Re-entering `/demos` after creating a project from a demo still shows the
    catalogue.
57. Markdown in summaries/headings/chapters is rendered, not shown as raw
    markdown source.
58. (Localisation forward-guard) The hard-coded `"en"` language in resource
    URLs is exercised; if/when language support lands these URLs change —
    a test pinning the current behaviour helps catch that.
