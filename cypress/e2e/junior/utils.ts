function selectPanelTab(containerClass: string, tabMatch: string) {
  cy.get(`.${containerClass} .nav-item`).as("tabs").contains(tabMatch).click();
  cy.get("@tabs")
    .find("button.active")
    .should("have.length", 1)
    .contains(tabMatch);
}
