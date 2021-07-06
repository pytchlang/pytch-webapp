context("Watch variables", () => {
  before(() => {
    cy.pytchExactlyOneProject();
  });

  [
    {
      label: "default",
      kwargsCode: "",
      expStyle: { left: "4px", top: "4px" },
    },
    {
      label: "top-left",
      kwargsCode: ", top=176, left=-236",
      expStyle: { left: "4px", top: "4px" },
    },
    {
      label: "top-right",
      kwargsCode: ", top=176, right=236",
      expStyle: { right: "4px", top: "4px" },
    },
    {
      label: "bottom-left",
      kwargsCode: ", bottom=-176, left=-236",
      expStyle: { left: "4px", bottom: "4px" },
    },
    {
      label: "bottom-right",
      kwargsCode: ", bottom=-176, right=236",
      expStyle: { right: "4px", bottom: "4px" },
    },
  ].forEach((spec) => {
    it(`shows a Sprite instance variable (${spec.label})`, () => {
      cy.pytchBuildCode(`
        import pytch

        class Banana(pytch.Sprite):
          Costumes = ["red-rectangle-80-60.png"]

          @pytch.when_key_pressed("s")
          def show_score(self):
            self.score = 42
            pytch.show_variable(self, "score"${spec.kwargsCode})

          @pytch.when_key_pressed("h")
          def hide_score(self):
            pytch.hide_variable(self, "score")
      `);

      cy.pytchSendKeysToProject("s");

      cy.get(".attribute-watcher").as("watcher").should("have.length", 1);
      for (const attr in spec.expStyle) {
        cy.get("@watcher").should("have.css", attr, spec.expStyle[attr]);
      }

      cy.pytchSendKeysToProject("h");
      cy.get("@watcher").should("not.exist");
    });
  });
});
