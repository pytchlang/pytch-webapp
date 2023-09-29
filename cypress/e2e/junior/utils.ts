function selectPanelTab(containerClass: string, tabMatch: string) {
  cy.get(`.${containerClass} .nav-item`).as("tabs").contains(tabMatch).click();
  cy.get("@tabs")
    .find("button.active")
    .should("have.length", 1)
    .contains(tabMatch);
}

export function selectActorAspect(
  tabLabel: "Code" | "Costumes" | "Backdrops" | "Sounds"
) {
  selectPanelTab("Junior-ActorProperties-container", tabLabel);
}

export function selectInfoPane(tabLabel: "Output" | "Errors") {
  selectPanelTab("Junior-InfoPanel-container", tabLabel);
}
