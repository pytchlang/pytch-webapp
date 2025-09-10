/// <reference types="cypress" />

import { assertModalWithTitle } from "./utils";

context("Front page", () => {
  const urlWithinBase = (path: string) => {
    const base = Cypress.config("baseUrl");
    const baseOk = base != null && base.endsWith("/");
    if (!baseOk) throw new Error("Cypress baseUrl config should end in a /");
    return `${base}${path}`;
  };

  type LaunchCodingJourneyModalOpts = { expectDeviceSizeWarning: boolean };
  const launchCodingJourneyModal = (opts: LaunchCodingJourneyModalOpts) => {
    cy.contains("coding journey").click();
    cy.get(".modal").should("be.visible");
    if (opts.expectDeviceSizeWarning)
      cy.contains("reasonably large screen").should("be.visible");
  };

  type ItRunsCodingJourneysOpts = LaunchCodingJourneyModalOpts;
  const itRunsCodingJourneys = (opts: ItRunsCodingJourneysOpts) =>
    it("runs coding journeys", () => {
      launchCodingJourneyModal(opts);
      cy.get("button.btn-close").click();
      cy.get(".modal").should("not.exist");

      launchCodingJourneyModal(opts);
      cy.contains("guided help and tutorials").click();
      cy.get(".modal").should("not.exist");
      cy.contains("This tutorial will introduce you");
      cy.location("href").should("eq", urlWithinBase("tutorials/"));
      cy.get(".home-link").click();

      launchCodingJourneyModal(opts);
      cy.contains("Start a new project").click();
      cy.contains("Start a new project").should("not.exist");
      assertModalWithTitle("Create a new project");
      cy.get("button").contains("sprites and scripts");
      cy.get("button").contains("Cancel").click();
      cy.get(".modal").should("not.exist");

      launchCodingJourneyModal(opts);
      cy.contains("Start a new project").click();
      cy.get(".modal-body input").type(
        "{selectAll}{del}E2E test project{enter}"
      );
      cy.get(".StageControls");
      cy.get(".ActorsList");
      cy.go("back");
    });

  context("narrow viewport", () => {
    const burgerMenuShouldBe = (expState: "collapsed" | "expanded") => {
      cy.get(`.burger-menu.is-${expState}`);
    };
    const openBurger = () => {
      cy.get(".burger-menu.is-collapsed").click();
      cy.get("li").contains("My projects").should("be.visible");
      burgerMenuShouldBe("expanded");
    };
    const closeBurger = () => {
      cy.get(".burger-menu.is-expanded").click();
      cy.get("li").contains("My projects").should("not.be.visible");
      burgerMenuShouldBe("collapsed");
    };
    const chooseBurgerItem = (match: string) => {
      cy.get(".NavBar ul.menuIsExpanded li").contains(match).click();
    };

    beforeEach(() => {
      cy.viewport(720, 960);
      cy.visit("/");
    });

    it("looks OK", () => {
      burgerMenuShouldBe("collapsed");
      cy.get(".burger-menu").should("be.visible");
      cy.get("li").contains("My projects").should("not.be.visible");
    });

    it("navigates to contact", () => {
      openBurger();
      cy.get("a.contact-us-link").click();
      burgerMenuShouldBe("collapsed");
      cy.contains("Please email us").should("be.visible");
    });

    it("burger menu", () => {
      openBurger();
      closeBurger();

      openBurger();
      chooseBurgerItem("My projects");
      cy.location("href").should("eq", urlWithinBase("my-projects/"));
      cy.get("h1").contains("My projects");
      cy.go("back");

      burgerMenuShouldBe("collapsed");
    });

    itRunsCodingJourneys({ expectDeviceSizeWarning: true });
  });

  context("wide viewport", () => {
    beforeEach(() => {
      cy.viewport(1024, 960);
      cy.visit("/");
    });

    it("looks OK", () => {
      cy.get(".burger-menu").should("not.be.visible");
      cy.get("li").contains("My projects").should("be.visible");
    });

    it("navigates to contact", () => {
      cy.get("a.contact-us-link").should("be.visible").click();
      cy.contains("Please email us").should("be.visible");
    });

    itRunsCodingJourneys({ expectDeviceSizeWarning: false });
  });

  context("card carousel", () => {
    const kTotalNCards = 4;
    const visibleCards = ($alerts: JQuery<HTMLElement>) =>
      $alerts.toArray().filter((elt) => {
        const style = getComputedStyle(elt);
        return style.getPropertyValue("display") === "block";
      });
    const assertVisibleCardNames = (expNames: Array<string>) => {
      cy.get(".alert.TutorialMiniCard")
        .should("have.length", kTotalNCards)
        .then(($alerts) => {
          const gotNames = visibleCards($alerts).map(
            (elt) => elt.querySelector("h3")?.innerText
          );
          cy.wrap(gotNames).should("deep.equal", expNames);
        });
    };

    const allNames = ["Catch a star", "Boing", "Q*bert", "Splat the moles"];

    beforeEach(() => cy.visit("/"));

    it("shows correct number", () => {
      cy.viewport(720, 960);
      assertVisibleCardNames(allNames.slice(0, 1));

      cy.viewport(780, 960);
      assertVisibleCardNames(allNames.slice(0, 2));

      cy.viewport(1380, 960);
      assertVisibleCardNames(allNames.slice(0, 3));
    });

    it("cycles with arrows", () => {
      cy.viewport(1440, 960);

      cy.get("button.next-arrow").click();
      assertVisibleCardNames(allNames.slice(1, 4));

      cy.get("button.prev-arrow").click();
      assertVisibleCardNames(allNames.slice(0, 3));

      cy.get("button.prev-arrow").click();
      assertVisibleCardNames([allNames[3], ...allNames.slice(0, 2)]);
    });

    it("launches demo", () => {
      cy.viewport(1440, 960);
      cy.get(".alert.TutorialMiniCard").contains("Boing").click();
      cy.get(".Junior-InfoPanel");
      cy.get(".ReadOnlyOverlay").should("not.exist");
      cy.go("back");
      assertVisibleCardNames(allNames.slice(0, 3));
    });
  });

  context("video player", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("opens and closes", () => {
      cy.get(".video-container").click();
      cy.get(".OverviewVideoModal").should("be.visible");
      cy.get("button").contains("Close").click();
      cy.get(".OverviewVideoModal").should("not.exist");
    });
  });
});
