context("Work with list of actors", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const launchAddSprite = () =>
    cy.get(".Junior-ActorsList-container .AddSomethingButton").click();
});
