/// <reference types="cypress" />

import { promiseAndResolve } from "../../src/utils";

const helpContainerSelector = ".ActivityContent > .HelpSidebar";
const helpToggleSelector = '.tabkey-icon svg[data-icon="circle-question"]';

const withSectionHeadings = (callback: (headings: Array<string>) => void) => {
  cy.readFile("src/data/help-sidebar/by-lang/en.json").then((data) => {
    const headingBlocks = data.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => item.kind === "heading"
    );

    const headings = headingBlocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.heading);

    callback(headings);
  });
};

const assertSectionHeadings = (
  helpSelector: string,
  headings: Array<string>
) => {
  cy.get(helpSelector)
    .find("details > summary > h1 > span.content")
    .then((spans) => {
      const gotHeadings = spans.toArray().map((elt) => elt.innerText);
      cy.wrap(gotHeadings).should("deep.equal", headings);
    });
};

const assertAllSectionsCollapsed = (
  helpSelector: string,
  headings: Array<string>
) => {
  assertSectionHeadings(helpSelector, headings);

  cy.get(helpSelector)
    .find("details > summary > h1")
    .parent()
    .parent()
    .each((dtls) => {
      cy.wrap(dtls).should("not.have.attr", "open");
    });
};

type SidebarTestSpec = {
  label: string;
  before(): void;
};

const flatIdeSpec: SidebarTestSpec = {
  label: "flat",
  before() {
    cy.pytchExactlyOneProject();
  },
};

const perMethodIdeSpec: SidebarTestSpec = {
  label: "per-method",
  before() {
    cy.pytchBasicJrProject();
  },
};

const sidebarTestSpecs = [flatIdeSpec, perMethodIdeSpec];

sidebarTestSpecs.forEach((spec) =>
  context(`Help sidebar (${spec.label})`, () => {
    const getHelpContainer = () => cy.get(helpContainerSelector);

    const assertAllCollapsedExcept = (
      allHeadings: Array<string>,
      expandedHeadings: Array<string>
    ) => {
      assertSectionHeadings(helpContainerSelector, allHeadings);
      getHelpContainer()
        .find("details > summary > h1")
        .parent()
        .parent()
        .each((dtls, idx) => {
          const predicate = expandedHeadings.includes(allHeadings[idx])
            ? "have.attr"
            : "not.have.attr";
          cy.wrap(dtls).should(predicate, "open");
        });
    };

    const assertAllCollapsed = (headings: Array<string>) =>
      assertAllSectionsCollapsed(helpContainerSelector, headings);

    const openSidebar = () => {
      getHelpContainer().should("not.exist");
      cy.get(helpToggleSelector).click();
      getHelpContainer().should("be.visible");
    };

    const closeSidebar = () => {
      getHelpContainer().should("be.visible");
      cy.get(helpToggleSelector).click();
      getHelpContainer().should("not.exist");
    };

    before(() => {
      spec.before();
      closeSidebar();
    });

    it("allows user to open/close sidebar", () => {
      openSidebar();
      closeSidebar();
    });

    it("has section list in sidebar", () =>
      withSectionHeadings((headings) => {
        openSidebar();
        assertAllCollapsed(headings);
        closeSidebar();
      }));

    it("can expand/contract one section", () =>
      withSectionHeadings((headings) => {
        openSidebar();
        getHelpContainer().contains("Operators").click();
        getHelpContainer().contains("math.floor");
        assertAllCollapsedExcept(headings, ["Operators"]);
        getHelpContainer().contains("Operators").click();
        assertAllCollapsed(headings);
        closeSidebar();
      }));

    it("can expand one section then another", () =>
      withSectionHeadings((headings) => {
        openSidebar();
        getHelpContainer().contains("Operators").click();
        getHelpContainer().contains("math.floor");

        getHelpContainer().contains("Working with variables").click();
        getHelpContainer().contains("pytch.show_variable");
        assertAllCollapsedExcept(headings, [
          "Operators",
          "Working with variables",
        ]);
        getHelpContainer().contains("Working with variables").click();
        assertAllCollapsedExcept(headings, ["Operators"]);

        // Click centre-left to check for absence of bug SF noticed with
        // hover tooltips in "per-method" editor.
        getHelpContainer().contains("Motion").click("left");
        assertAllCollapsedExcept(headings, ["Operators", "Motion"]);
        getHelpContainer().contains("Motion").click("left");
        getHelpContainer().contains("Operators").click();

        assertAllCollapsed(headings);
        closeSidebar();
      }));

    it("collapses sections when hiding sidebar", () => {
      withSectionHeadings((headings) => {
        openSidebar();
        getHelpContainer().contains("Operators").click();
        getHelpContainer().contains("math.floor");

        closeSidebar();
        openSidebar();

        assertAllCollapsed(headings);
        closeSidebar();
      });
    });

    it("allows help text to be shown", () => {
      openSidebar();
      getHelpContainer().contains("Looks").click();
      cy.get("summary > h2")
        .contains("self.backdrop_number")
        .parentsUntil(".pytch-method")
        .eq(0)
        .parent()
        .as("item-details")
        .click();
      cy.get("details[open] details[open]").contains(
        "Python counts list entries"
      );
      cy.get("@item-details").click();
      getHelpContainer().contains("Looks").click();
      closeSidebar();
    });

    it("gives Scratch blocks an accessible name", () => {
      const assertBlockNamed = (section: string, text: string) => {
        getHelpContainer().contains(section).click();
        getHelpContainer()
          .find(`svg.scratchblocks[aria-label="Scratch block: ${text}"]`)
          .should("have.attr", "role", "img");
        getHelpContainer().contains(section).click();
      };

      openSidebar();
      // The per-method test project has the Stage selected, and the
      // Stage has no motion blocks.
      if (spec.label === "flat")
        assertBlockNamed("Motion", "turn anticlockwise 90 degrees");
      assertBlockNamed("Events", "when green flag clicked");
      assertBlockNamed("Control", "repeat until (touching Banana?)");
      assertBlockNamed("Operators", "(n-cats > 3) and (n-dogs > 5)");
      assertBlockNamed(
        "Working with lists",
        "item (pick random 1 to (length of cats)) of cats"
      );
      closeSidebar();
    });
  })
);

context("Help sidebar (cross-mode)", () => {
  it("opens project with sidebar collapsed", () => {
    cy.pytchExactlyOneProject();
    cy.pytchBasicJrProject();

    cy.pytchSwitchProject("Test seed project");
    cy.get(helpContainerSelector).should("be.visible");

    cy.pytchSwitchProject("Per-method test project");
    cy.get(helpContainerSelector).should("be.visible");
    cy.get(helpContainerSelector).contains("Sound").click();

    cy.pytchSwitchProject("Test seed project");
    withSectionHeadings((headings) =>
      assertAllSectionsCollapsed(helpContainerSelector, headings)
    );
  });
});

context("Key-nav help sidebar", () => {
  beforeEach(() => {
    cy.pytchExactlyOneProject();
    cy.intercept("GET", "**/keyboard-shortcuts.json", {
      statusCode: 404,
      body: "404 Not Found!",
    });
  });

  it("message for failure", () => {
    cy.get('button[data-activity-bar-tab="keynavhelp"]').click();
    cy.get(".KeyNavHelpSidebar").contains("Sorry");
    cy.get(".KeyNavHelpSidebar").contains("keyboard navigation");
    cy.get(".KeyNavHelpSidebar .ErrorFetchingSomething").should("have.focus");
  });
});

context("Key-nav help sidebar (slow load)", () => {
  it("takes focus only once content loaded", () => {
    cy.pytchExactlyOneProject();

    // Hold the response until the test releases it.  Cypress waits for
    // a Promise returned by the request handler before passing the
    // request on.
    const { promise: gate, resolve: releaseResponse } = promiseAndResolve();
    cy.intercept("GET", "**/keyboard-shortcuts.json", () => gate);

    cy.get('button[data-activity-bar-tab="keynavhelp"]').as("tab").click();
    cy.get(".KeyNavHelpSidebar .spinner-border");
    cy.get(".KeyNavHelpSidebar .help-text").should("not.exist");
    cy.get("@tab").should("have.focus");

    cy.then(() => releaseResponse());
    cy.get(".KeyNavHelpSidebar .help-text").should("exist");
    cy.get(".KeyNavHelpSidebar").should("have.focus");
  });
});

context("Help sidebar load failure", () => {
  beforeEach(() => {
    // The help content is a Vite asset, named "en-HASH.json" in a
    // build, or served from its source location by the dev server.
    cy.intercept(
      "GET",
      /\/(assets\/en-[^/]+|help-sidebar\/by-lang\/en)\.json/,
      { statusCode: 404, body: "404 Not Found!" }
    );
    cy.pytchExactlyOneProject();
  });

  it("sends focus to error message", () => {
    cy.get(helpContainerSelector).contains("Sorry");
    cy.get(helpToggleSelector).click();
    cy.get(helpContainerSelector).should("not.exist");
    cy.get(helpToggleSelector).click();
    cy.get(`${helpContainerSelector} .ErrorFetchingSomething`).should(
      "have.focus"
    );
  });
});
