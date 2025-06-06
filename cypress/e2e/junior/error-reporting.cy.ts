import {
  selectStage,
  selectActorAspect,
  selectInfoPane,
  selectSprite,
  loadAndRunDemo,
  usingPytchJrProgram,
} from "./utils";

context("Interact with errors", () => {
  beforeEach(loadAndRunDemo("simple-pytchjr-project"));

  const goToErrorLocationSpecs = [
    { activeActor: "stage", activateActorFun: selectStage },
    { activeActor: "sprite", activateActorFun: () => selectSprite("Snake") },
  ];

  goToErrorLocationSpecs.forEach((spec) =>
    it(`switches to error tab on error (${spec.activeActor} active)`, () => {
      usingPytchJrProgram((program, actions) => {
        const snake = program.actors[1];
        actions.setHandlerPythonCode({
          actorId: snake.id,
          handlerId: snake.handlers[0].id,
          code: 'print(3 + "a")\n',
        });

        // I /think/ this has now updated the store, which is what the build
        // process uses, so we don't have to wait for the DOM to update with
        // the new code.
        spec.activateActorFun();
        selectActorAspect("Sounds");
        selectInfoPane("Output");
        cy.pytchGreenFlag();

        cy.pytchShouldShowJuniorErrorCard(
          "unsupported operand type(s)",
          "user-space"
        );

        cy.get(".go-to-line").should("have.length", 1).click();
        cy.get(".ActorCard").eq(1).should("have.class", "isActive");
        cy.contains('3 + "a"').should("be.visible");
      });
    })
  );
});
