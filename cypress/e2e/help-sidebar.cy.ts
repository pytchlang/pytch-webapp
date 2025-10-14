/// <reference types="cypress" />

const helpContainerSelector = ".ActivityContent > .HelpSidebar";
const helpToggleSelector = '.tabkey-icon svg[data-icon="circle-question"]';

const useSectionHeadings = (callback: (headings: Array<string>) => void) => {
  cy.request("data/help-sidebar.json").then((response) => {
    const headingBlocks = response.body.filter(
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

type SidebarTestContext = {
  label: string;
  before(): void;
};

const flatIdeContext: SidebarTestContext = {
  label: "flat",
  before() {
    cy.pytchExactlyOneProject();
  },
};

const perMethodIdeContext: SidebarTestContext = {
  label: "per-method",
  before() {
    cy.pytchBasicJrProject();
  },
};

const sidebarTestContexts = [flatIdeContext, perMethodIdeContext];

sidebarTestContexts.forEach((ctx) =>
  context(`Help sidebar (${ctx.label})`, () => {
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
      ctx.before();
      closeSidebar();
    });

    it("allows user to open/close sidebar", () => {
      openSidebar();
      closeSidebar();
    });

    it("has section list in sidebar", () =>
      useSectionHeadings((headings) => {
        openSidebar();
        assertAllCollapsed(headings);
        closeSidebar();
      }));

    it("can expand/contract one section", () =>
      useSectionHeadings((headings) => {
        openSidebar();
        getHelpContainer().contains("Operators").click();
        getHelpContainer().contains("math.floor");
        assertAllCollapsedExcept(headings, ["Operators"]);
        getHelpContainer().contains("Operators").click();
        assertAllCollapsed(headings);
        closeSidebar();
      }));

    it("can expand one section then another", () =>
      useSectionHeadings((headings) => {
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
      useSectionHeadings((headings) => {
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
    useSectionHeadings((headings) =>
      assertAllSectionsCollapsed(helpContainerSelector, headings)
    );
  });
});
