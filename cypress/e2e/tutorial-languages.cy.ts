/// <reference types="cypress" />

// Tutorials in more than one language.  A translation is a separate
// tutorial (own slug) sharing its `tutorialId` with the others.  The
// served tutorials have shoot-the-fruit in "en" and "ga"; all others
// are "en" only.  A made-up "de" translation is added by intercept
// where needed.  No tutorial exists only in a non-"en" language, so
// that case is untested.  Duplicate (tutorialId, language) pairs and
// strict metadata parsing are covered by unit tests.

import { chooseUiLanguage } from "./discoverable-demos/utils";
import { clearBrowserCache } from "./utils";

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
