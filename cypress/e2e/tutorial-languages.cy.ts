/// <reference types="cypress" />

// Tutorials in more than one language.  A translation is a separate
// tutorial (own slug) sharing its `tutorialId` with the others.  The
// served tutorials have shoot-the-fruit in "en" and "ga"; all others
// are "en" only.  A made-up "de" translation is added by intercept
// where needed.  No tutorial exists only in a non-"en" language, so
// that case is untested.  Duplicate (tutorialId, language) pairs and
// strict metadata parsing are covered by unit tests.

import { chooseUiLanguage } from "./discoverable-demos/utils";
import { assertInIDE, clearBrowserCache } from "./utils";

const kEnSlug = "script-by-script-shoot-the-fruit";
const kGaSlug = "script-by-script-shoot-the-fruit--ga";
const kDeSlug = "script-by-script-shoot-the-fruit--de";
const kEnDisplayName = "Script-by-script Shoot the fruit";
const kGaDisplayName = "Script-ar-script Buail an t-úll";
const kDeDisplayName = "Skript für Skript: Obst abschießen";

// All tutorials except the "ga" translation of shoot-the-fruit:
const kNTutorials = 19;

const kEnglishBadge = { text: "English", lang: "en" };
const kIrishBadge = { text: "Gaeilge", lang: "ga" };
const kGermanBadge = { text: "Deutsch", lang: "de" };
type BadgeSpec = typeof kEnglishBadge;

/** The path of the app's given `route`, allowing for the app being
 * served below the root (as in a deployed build). */
const appPath = (route: string) =>
  new URL(route, Cypress.config("baseUrl")!).pathname;

/** Intercept the tutorial index, adding a made-up "de" translation of
 * shoot-the-fruit at the end.  Clear the browser cache first, so a
 * cached copy can't bypass the intercept. */
function interceptIndexWithGermanTranslation() {
  clearBrowserCache();
  cy.intercept("GET", "**/tutorial-index.html", (req) => {
    req.continue((res) => {
      const doc = new DOMParser().parseFromString(res.body, "text/html");
      const enDiv = doc.querySelector<HTMLDivElement>(
        `div.tutorial-summary[data-tutorial-name="${kEnSlug}"]`
      )!;
      const deDiv = enDiv.cloneNode(true) as HTMLDivElement;
      deDiv.dataset.tutorialName = kDeSlug;
      const metadata = JSON.parse(deDiv.dataset.metadataJson!);
      metadata.language = "de";
      metadata.displayName = kDeDisplayName;
      deDiv.dataset.metadataJson = JSON.stringify(metadata);
      deDiv.querySelector("h1")!.textContent = kDeDisplayName;
      enDiv.parentElement!.appendChild(deDiv);
      res.body = doc.body.innerHTML;
      // Don't let later tests see this modified index:
      res.headers["cache-control"] = "no-store";
      delete res.headers["etag"];
      delete res.headers["last-modified"];
    });
  });
}

const kListCardSelector = ".tutorial-list > li > .TutorialCard";
const listCards = () => cy.get(kListCardSelector);
const listCardForSlug = (slug: string) =>
  cy.get(`${kListCardSelector}[data-slug="${slug}"]`);

function visitTutorialsPage() {
  cy.visit("/tutorials/");
  // The chosen language persists across tests; start from "en".
  chooseUiLanguage("en");
  listCards().should("have.length", kNTutorials);
}

function badgeShouldBe(
  card: () => Cypress.Chainable<JQuery<HTMLElement>>,
  expBadge: BadgeSpec | null
) {
  const badge = () => card().find(".pill-language");
  if (expBadge == null) {
    badge().should("not.exist");
  } else {
    badge()
      .should("have.text", expBadge.text)
      .and("have.attr", "lang", expBadge.lang);
  }
}

////////////////////////////////////////////////////////////////////////
// Language switch

const kLanguageSwitchSelector = ".TwoStateSwitch.tutorials-language-switch";

function clickLanguageSwitch() {
  cy.get(`${kLanguageSwitchSelector} label.form-label`).click();
}

/** Assert (with retry) whether the language switch is on (showing all
 * tutorials), and that the shown description of its state is
 * `statusText`. */
function languageSwitchShouldBe(showAll: boolean, statusText: string) {
  cy.get(`${kLanguageSwitchSelector} input[type="checkbox"]`).should(
    showAll ? "be.checked" : "not.be.checked"
  );
  const shown = showAll ? "when-true" : "when-false";
  cy.get(`${kLanguageSwitchSelector} .${shown}`).should(
    "have.text",
    statusText
  );
}

function languageSwitchQuestionShouldBe(text: string) {
  cy.get(`${kLanguageSwitchSelector} .fw-bold`).should("have.text", text);
}

////////////////////////////////////////////////////////////////////////

context("Tutorials list — languages", () => {
  beforeEach(visitTutorialsPage);

  const kGaAllStatus = "Ranganna teagaisc i ngach teanga á dtaispeáint";
  const kGaJustGaStatus = "Ranganna teagaisc as Gaeilge amháin á dtaispeáint";

  type ListSpec = {
    uiLanguage: string;
    expShootFruitSlug: string;
    expShootFruitBadge: BadgeSpec | null;
    expBoingBadge: BadgeSpec | null;
  };
  const listSpecs: Array<ListSpec> = [
    {
      uiLanguage: "en",
      expShootFruitSlug: kEnSlug,
      expShootFruitBadge: null,
      expBoingBadge: null,
    },
    {
      uiLanguage: "ga",
      expShootFruitSlug: kGaSlug,
      expShootFruitBadge: null,
      expBoingBadge: kEnglishBadge,
    },
    {
      uiLanguage: "de",
      expShootFruitSlug: kEnSlug,
      expShootFruitBadge: kEnglishBadge,
      expBoingBadge: kEnglishBadge,
    },
  ];

  // One card per tutorial, in the UI language if available, else the
  // most preferred one; a language badge only if not the UI language.
  listSpecs.forEach((spec) => {
    it(`shows each tutorial once (${spec.uiLanguage})`, () => {
      chooseUiLanguage(spec.uiLanguage);
      listCards().should("have.length", kNTutorials);

      // The shoot-the-fruit tutorial is shown in the position of its
      // first translation in the index, which is the "ga" one.
      listCards()
        .eq(1)
        .should("have.attr", "data-slug", spec.expShootFruitSlug);

      const expLanguage = spec.expShootFruitSlug === kGaSlug ? "ga" : "en";
      const otherSlug = spec.expShootFruitSlug === kGaSlug ? kEnSlug : kGaSlug;
      const shootFruitCard = () => listCardForSlug(spec.expShootFruitSlug);
      shootFruitCard().should(
        "have.attr",
        "data-tutorial-language",
        expLanguage
      );
      listCardForSlug(otherSlug).should("not.exist");
      badgeShouldBe(shootFruitCard, spec.expShootFruitBadge);

      const boingCard = () => listCardForSlug("boing");
      boingCard().should("have.attr", "data-tutorial-language", "en");
      badgeShouldBe(boingCard, spec.expBoingBadge);
    });
  });

  // Card title and body have `lang` of the tutorial's language.
  it("marks card content with its language", () => {
    chooseUiLanguage("ga");
    const card = () => listCardForSlug(kGaSlug);
    card().find(".card-title").should("have.attr", "lang", "ga");
    card().find(".card-body").should("have.attr", "lang", "ga");
    listCardForSlug("boing")
      .find(".card-body")
      .should("have.attr", "lang", "en");
  });

  // The language switch starts on; off shows only tutorials with a
  // translation in the UI language.
  it("shows only tutorials in the UI language when switched off", () => {
    chooseUiLanguage("ga");
    languageSwitchShouldBe(true, kGaAllStatus);
    clickLanguageSwitch();
    languageSwitchShouldBe(false, kGaJustGaStatus);
    listCards().should("have.length", 1);
    listCardForSlug(kGaSlug).should("have.length", 1);
    listCards().find(".pill-language").should("not.exist");

    clickLanguageSwitch();
    languageSwitchShouldBe(true, kGaAllStatus);
    listCards().should("have.length", kNTutorials);
  });

  // When off, the switch's text names the UI language, and it follows
  // changes of UI language.
  it("follows the UI language", () => {
    languageSwitchQuestionShouldBe("Show tutorials in all languages?");
    clickLanguageSwitch();
    languageSwitchShouldBe(false, "Showing just tutorials in English");
    listCards().should("have.length", kNTutorials);
    listCardForSlug(kEnSlug).should("have.length", 1);

    chooseUiLanguage("ga");
    languageSwitchShouldBe(false, kGaJustGaStatus);
    listCards().should("have.length", 2);

    chooseUiLanguage("de");
    languageSwitchQuestionShouldBe("Tutorials in allen Sprachen anzeigen?");
    languageSwitchShouldBe(false, "Nur Tutorials auf Deutsch werden angezeigt");
    listCards().should("have.length", 0);

    clickLanguageSwitch();
    listCards().should("have.length", kNTutorials);
  });

  // Difficulty labels are translated.
  it("translates difficulty labels", () => {
    const difficulty = () => listCardForSlug(kEnSlug).find(".tag-difficulty");
    difficulty().should("have.text", "beginner");
    chooseUiLanguage("de");
    difficulty().should("have.text", "Anfänger");
    chooseUiLanguage("en");
    difficulty().should("have.text", "beginner");
  });
});

////////////////////////////////////////////////////////////////////////

context("Single-tutorial page — other translations", () => {
  const otherTranslations = () => cy.get(".other-translations");
  const otherTranslationCards = () =>
    cy.get(".other-translations .TutorialCard");

  function visitSingleTutorial(route: string, slug: string) {
    cy.visit(`/${route}/${slug}`);
    chooseUiLanguage("en");
    cy.get(".tutorial-list .TutorialCard").should("have.length.at.least", 1);
  }

  type OtherCardSpec = {
    slug: string;
    language: string;
    displayName: string;
    badge: BadgeSpec;
  };

  function otherCardsShouldBe(route: string, expCards: Array<OtherCardSpec>) {
    otherTranslationCards().should("have.length", expCards.length);
    expCards.forEach((exp, idx) => {
      const card = () => otherTranslationCards().eq(idx);
      card()
        .should("have.attr", "data-slug", exp.slug)
        .and("have.attr", "data-tutorial-language", exp.language);
      card()
        .find(".card-title a")
        .should("have.text", exp.displayName)
        .and("have.attr", "lang", exp.language)
        .and("have.attr", "href", appPath(`${route}/${exp.slug}`));
      badgeShouldBe(card, exp.badge);
    });
  }

  ["suggested-tutorial", "suggested-tutorial-demo"].forEach((route) => {
    // "Also available in" section: link-only cards (same route) with
    // a badge even in the UI language; heading is singular/plural.
    it(`shows other translation (${route})`, () => {
      visitSingleTutorial(route, kGaSlug);
      otherTranslations()
        .find("h2")
        .should(
          "have.text",
          "This tutorial is also available in another language:"
        );
      otherCardsShouldBe(route, [
        {
          slug: kEnSlug,
          language: "en",
          displayName: kEnDisplayName,
          badge: kEnglishBadge,
        },
      ]);
      otherTranslationCards().find("button").should("not.exist");

      chooseUiLanguage("ga");
      otherCardsShouldBe(route, [
        {
          slug: kEnSlug,
          language: "en",
          displayName: kEnDisplayName,
          badge: kEnglishBadge,
        },
      ]);
    });
  });

  // Other translations are ordered by preference given UI language.
  it("orders other translations by language preference", () => {
    interceptIndexWithGermanTranslation();
    const route = "suggested-tutorial";
    visitSingleTutorial(route, kGaSlug);
    otherTranslations()
      .find("h2")
      .should(
        "have.text",
        "This tutorial is also available in other languages:"
      );

    const enCard = {
      slug: kEnSlug,
      language: "en",
      displayName: kEnDisplayName,
      badge: kEnglishBadge,
    };
    const deCard = {
      slug: kDeSlug,
      language: "de",
      displayName: kDeDisplayName,
      badge: kGermanBadge,
    };
    otherCardsShouldBe(route, [enCard, deCard]);

    chooseUiLanguage("de");
    otherCardsShouldBe(route, [deCard, enCard]);
  });

  // No "also available in" section if no other translations.
  it("shows no section for tutorial without translations", () => {
    visitSingleTutorial("suggested-tutorial", "boing");
    cy.get(".tutorial-list .TutorialCard .card-title").should(
      "have.text",
      "Boing — a Pong-like game"
    );
    otherTranslations().should("not.exist");
  });

  // Following the link shows the other translation's own page.
  it("navigates to other translation", () => {
    visitSingleTutorial("suggested-tutorial", kGaSlug);
    const mainCard = () => cy.get(".tutorial-list > li > .TutorialCard");
    mainCard().find(".card-body").should("contain.text", "Faigh pointí");

    otherTranslationCards().find(".card-title a").click();
    cy.location("pathname").should(
      "eq",
      appPath(`suggested-tutorial/${kEnSlug}`)
    );
    mainCard().should("have.attr", "data-slug", kEnSlug);
    mainCard().find(".card-body").should("contain.text", "Score points");
    otherCardsShouldBe("suggested-tutorial", [
      {
        slug: kGaSlug,
        language: "ga",
        displayName: kGaDisplayName,
        badge: kIrishBadge,
      },
    ]);
  });

  // Not affected by the list page's language switch.
  it("ignores the list page's language switch", () => {
    visitTutorialsPage();
    clickLanguageSwitch();
    languageSwitchShouldBe(false, "Showing just tutorials in English");
    cy.visit(`/suggested-tutorial/${kEnSlug}`);
    otherCardsShouldBe("suggested-tutorial", [
      {
        slug: kGaSlug,
        language: "ga",
        displayName: kGaDisplayName,
        badge: kIrishBadge,
      },
    ]);
  });
});

////////////////////////////////////////////////////////////////////////

/** From its single-tutorial page, start the tutorial with the given
 * `slug`. */
function startTutorialFromSinglePage(slug: string) {
  cy.visit(`/suggested-tutorial/${slug}`);
  cy.get(".tutorial-list .TutorialCard .card-footer button")
    .contains("Tutorial")
    .click();
  cy.get(".Junior-InfoPanel");
  cy.get(".ReadOnlyOverlay").should("not.exist");
}

/** From the tutorials list, start the tutorial with the given `slug`,
 * by clicking the card's button whose label is `buttonLabel`. */
function startTutorialFromList(slug: string, buttonLabel: string) {
  listCardForSlug(slug).within(() => {
    cy.get(".card-footer button").contains(buttonLabel).click();
  });
  cy.get(".Junior-InfoPanel");
  cy.get(".ReadOnlyOverlay").should("not.exist");
}

function projectNamesShouldInclude(name: string) {
  cy.pytchHomeFromIDE();
  cy.contains("My projects").click();
  cy.get(".ProjectCard .project-name").should("contain.text", name);
}

context("Tutorial content — languages", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
    visitTutorialsPage();
  });

  // Per-method tutorial content has `lang` of the tutorial; UI text
  // within it (task, navigation buttons) has the UI language.
  it("marks per-method tutorial content", () => {
    startTutorialFromSinglePage(kGaSlug);
    assertInIDE("per-method");
    cy.get(".Lesson-Chapter").should("have.attr", "lang", "ga");
    cy.get(".LessonTableOfContents h1").should("have.attr", "lang", "en");
    cy.get(".Junior-ChapterNavigation")
      .should("have.attr", "lang", "en")
      .find("button.next")
      .click();
    cy.get(".LearnerTaskButtonStrip").first().should("have.attr", "lang", "en");
    cy.get(
      ".Junior-LessonContent-HeaderBar .chapter-title > span:not(.chapter-number)"
    ).should("have.attr", "lang", "ga");
  });

  // Likewise flat tutorial content.
  it("marks flat tutorial content", () => {
    chooseUiLanguage("ga");
    startTutorialFromList("boing", "Ranganna Teagaisc");
    cy.get(".TutorialChapter").should("have.attr", "lang", "en");
    cy.get(".Junior-ChapterNavigation").should("have.attr", "lang", "ga");
  });

  // The visually-hidden "opens in new tab" hint on a link is UI text.
  it("marks opens-in-new-tab hint", () => {
    chooseUiLanguage("de");
    startTutorialFromList("boing", "Tutorial");
    cy.get(".TutorialChapter a")
      .contains("Pong")
      .find(".opens-in-new-tab-hint")
      .should("have.attr", "lang", "de")
      .and("have.text", " (öffnet in neuem Tab)");
  });
});

context("Names of projects created from tutorials", () => {
  beforeEach(() => {
    cy.pytchResetDatabase();
  });

  // Named by the summary's display name (not the tutorial text's
  // title, which differs for boing), translated to the UI language.
  it("names project by display name", () => {
    visitTutorialsPage();
    startTutorialFromList("boing", "Tutorial");
    projectNamesShouldInclude('My "Boing — a Pong-like game"');
  });

  it("names project by display name (ga tutorial)", () => {
    visitTutorialsPage();
    startTutorialFromSinglePage(kGaSlug);
    projectNamesShouldInclude(`My "${kGaDisplayName}"`);
  });

  it("translates project name", () => {
    visitTutorialsPage();
    chooseUiLanguage("de");
    startTutorialFromList("boing", "Demo");
    projectNamesShouldInclude("Demo von „Boing — a Pong-like game“");
  });

  // Likewise from the checkpoint route and the front-page carousel.
  it("names checkpoint project by display name", () => {
    cy.visit("/");
    chooseUiLanguage("en");
    cy.visit("/tutorial-checkpoint/script-by-script-boing/6");
    cy.get(".TutorialCard.start-at-chapter button").click();
    cy.get(".Junior-InfoPanel");
    projectNamesShouldInclude('My "Boing — a Pong-like game"');
  });

  it("names carousel demo by display name", () => {
    cy.visit("/");
    chooseUiLanguage("en");
    cy.viewport(1440, 960);
    cy.get(".card.TutorialMiniCard").contains("Boing").click();
    cy.get(".Junior-InfoPanel");
    cy.get(".ReadOnlyOverlay").should("not.exist");
    projectNamesShouldInclude('Demo of "Boing — a Pong-like game"');
  });
});
