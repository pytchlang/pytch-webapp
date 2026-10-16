/// <reference types="cypress" />

// §12 Demos in more than one language

import { assertInIDE } from "../utils";
import {
  visitDemosPage,
  resetAndVisitDemosPage,
  interceptDemoCatalogue,
  assertDemoSidebar,
  typeSearch,
  clickDemoCardTitle,
  chooseUiLanguage,
  demoCardForUuid,
  kPolyglotDemo,
  kGaOnlyDemo,
  kBilingualDemo,
  kZipLinkedDemoUuid,
  kNRecommended,
  kDemosPerPage,
  kNPages,
  kNewestDemoName,
  kFirstDemoOnPage2Name,
  demoCards,
  demoCardCountShouldBe,
  firstCardTitleShouldBe,
  clickLanguageSwitch,
  languageSwitchQuestionShouldBe,
  languageSwitchShouldBe,
} from "./utils";

type CardSpec = {
  demo: { uuid: string; name: string };
  language: string;
  badge: { text: string; lang: string } | null;
};

/** Search for the demo of the given spec, and check that its (single)
 * card shows the entry in the expected language, with the expected
 * language badge (or none). */
function cardShouldMatch(spec: CardSpec) {
  typeSearch(spec.demo.name);
  demoCardForUuid(spec.demo.uuid)
    .should("have.length", 1)
    .and("have.attr", "data-demo-language", spec.language);

  const badge = () => demoCardForUuid(spec.demo.uuid).find(".pill-language");
  if (spec.badge == null) {
    badge().should("not.exist");
  } else {
    badge()
      .should("have.text", spec.badge.text)
      .and("have.attr", "lang", spec.badge.lang);
  }
}

const kEnglishBadge = { text: "English", lang: "en" };
const kIrishBadge = { text: "Gaeilge", lang: "ga" };

context("Discoverable demos — languages", () => {
  beforeEach(() => {
    visitDemosPage();
    // The chosen language persists across tests; start from "en".
    chooseUiLanguage("en");
  });

  // §12.59 — one card per demo, in the UI language where available,
  // otherwise in the most preferred available language, with a badge
  // when that is not the UI language.
  it("shows each demo once, preferring the UI language (en)", () => {
    cardShouldMatch({ demo: kPolyglotDemo, language: "en", badge: null });
    cardShouldMatch({ demo: kBilingualDemo, language: "en", badge: null });
    cardShouldMatch({
      demo: kGaOnlyDemo,
      language: "ga",
      badge: kIrishBadge,
    });
  });

  it("shows each demo once, preferring the UI language (ga)", () => {
    chooseUiLanguage("ga");
    cardShouldMatch({ demo: kPolyglotDemo, language: "ga", badge: null });
    cardShouldMatch({ demo: kGaOnlyDemo, language: "ga", badge: null });
    // Not in "ga", and "en" is preferred to "de".
    cardShouldMatch({
      demo: kBilingualDemo,
      language: "en",
      badge: kEnglishBadge,
    });
  });

  it("shows each demo once, preferring the UI language (de)", () => {
    chooseUiLanguage("de");
    cardShouldMatch({ demo: kBilingualDemo, language: "de", badge: null });
    cardShouldMatch({
      demo: kPolyglotDemo,
      language: "en",
      badge: kEnglishBadge,
    });
  });

  // §12.60 — changing the UI language re-processes the already-fetched
  // catalogue rather than fetching it again.
  it("fetches the catalogue only once across language changes", () => {
    chooseUiLanguage("ga");
    chooseUiLanguage("de");
    cardShouldMatch({ demo: kBilingualDemo, language: "de", badge: null });
    cy.get("@demosIndex.all").should("have.length", 1);
  });

  // §12.61 — "recommended" is a property of (demo, language), so the
  // recommended demos depend on the UI language.
  it("recommends demos according to the chosen entries", () => {
    const bilingualSlide = () =>
      cy
        .get(".demos-recommended .carousel-item h3")
        .filter(`:contains("${kBilingualDemo.name}")`);

    cy.get(".demos-recommended").contains(`1/${kNRecommended}`);
    bilingualSlide().should("have.length", 1);

    chooseUiLanguage("de");
    cy.get(".demos-recommended").contains(`1/${kNRecommended - 1}`);
    bilingualSlide().should("not.exist");
  });

  // §12.62 — recommended cards also show the language badge.
  it("shows the language badge on recommended cards", () => {
    cy.get(".demos-recommended .carousel-item.active .pill-language").should(
      "not.exist"
    );
    chooseUiLanguage("ga");
    cy.get(".demos-recommended .carousel-item.active .pill-language")
      .should("have.text", "English")
      .and("have.attr", "lang", "en");
  });

  // §12.65 — page strings with no translation in the UI language fall
  // back to "en" rather than being empty.
  it("shows untranslated page strings in English (ga)", () => {
    chooseUiLanguage("ga");
    cy.get(".NavbarLanguageChooser").should(
      "have.attr",
      "aria-label",
      "Teanga"
    );

    // When we get translations for these strings, this test will
    // fail, and then this test can be deleted.
    cy.get(".demos-header h1").contains("Demos");
    cy.get(".demos-recommended h2").contains("Recommended");
  });

  // §12.66 — the language switch starts on, showing demos in all
  // languages.  Turning it off restricts the results to demos with an
  // entry in the UI language; turning it on again shows all demos.
  it("shows only demos in the UI language when switched off", () => {
    chooseUiLanguage("ga");
    languageSwitchShouldBe(true, "Showing demos in all languages");
    clickLanguageSwitch();
    // No "ga" translation of the description, so the "en" one is used.
    languageSwitchShouldBe(false, "Showing just demos in Gaeilge");
    demoCardCountShouldBe(2);
    demoCardForUuid(kPolyglotDemo.uuid).should(
      "have.attr",
      "data-demo-language",
      "ga"
    );
    demoCardForUuid(kGaOnlyDemo.uuid).should(
      "have.attr",
      "data-demo-language",
      "ga"
    );
    demoCards().find(".pill-language").should("not.exist");

    clickLanguageSwitch();
    languageSwitchShouldBe(true, "Showing demos in all languages");
    demoCardCountShouldBe(kDemosPerPage);
    cy.get(".pagination").contains(`${kNPages}`);
  });

  // §12.67 — the switch's description names the UI language, and the
  // switch applies to whichever language the UI is in.
  it("follows the UI language", () => {
    languageSwitchQuestionShouldBe("Show demos in all languages?");
    clickLanguageSwitch();
    languageSwitchShouldBe(false, "Showing just demos in English");
    typeSearch(kGaOnlyDemo.name);
    cy.get(".no-results").should("exist");

    chooseUiLanguage("ga");
    languageSwitchShouldBe(false, "Showing just demos in Gaeilge");
    demoCardForUuid(kGaOnlyDemo.uuid).should("have.length", 1);

    chooseUiLanguage("de");
    languageSwitchQuestionShouldBe("Demos in allen Sprachen anzeigen?");
    languageSwitchShouldBe(false, "Nur Demos auf Deutsch werden angezeigt");
    cy.get(".no-results").should("exist");
  });

  // §12.68 — changing the switch returns to page 1.
  it("returns to page 1 when the switch changes", () => {
    cy.get(".pagination .page-item").contains("2").click();
    firstCardTitleShouldBe(kFirstDemoOnPage2Name);
    clickLanguageSwitch();
    firstCardTitleShouldBe(kNewestDemoName);
  });

  // §12.69 — the switch does not affect the recommended demos.
  it("does not restrict the recommended demos", () => {
    chooseUiLanguage("de");
    cy.get(".demos-recommended").contains(`1/${kNRecommended - 1}`);
    clickLanguageSwitch();
    demoCardCountShouldBe(1);
    cy.get(".demos-recommended").contains(`1/${kNRecommended - 1}`);
  });
});

context("Discoverable demos — languages of linked demos", () => {
  // §12.63 — a project created from a demo entry in a language other than
  // "en" fetches its demo content in that language.
  it("creates a project linked to the demo in the entry's language", () => {
    resetAndVisitDemosPage();
    chooseUiLanguage("en");
    cy.intercept("GET", `**/${kGaOnlyDemo.uuid}/ga/project.zip`).as(
      "gaZipfile"
    );
    cy.intercept("GET", `**/${kGaOnlyDemo.uuid}/ga/content/description.md`).as(
      "gaDescription"
    );

    typeSearch(kGaOnlyDemo.name);
    clickDemoCardTitle(kGaOnlyDemo.name);

    cy.wait("@gaZipfile");
    assertDemoSidebar();
    assertInIDE(kGaOnlyDemo.programKind);
    cy.wait("@gaDescription");
    cy.get(".DemoSidebar").contains(kGaOnlyDemo.descriptionFragment);
  });

  // §12.64 — a zipfile from before demo refs had a language is linked to
  // the "en" version of the demo.
  it('treats a demo link without a language as "en"', () => {
    cy.pytchResetDatabase();
    chooseUiLanguage("en");
    interceptDemoCatalogue();
    cy.intercept(
      "GET",
      `**/${kZipLinkedDemoUuid}/en/content/description.md`
    ).as("enDescription");

    cy.pytchTryUploadZipfiles(["v4-jr-linked-to-game-demo.zip"]);
    cy.wait("@enDescription");
    assertDemoSidebar();
  });
});
