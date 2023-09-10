import { Actions } from "easy-peasy";
import { IActiveProject } from "../../../src/model/project";
import { StructuredProgram } from "../../../src/model/junior/structured-program";

context("Interact with errors", () => {
  beforeEach(() => {
    // Initial ** is to match the fetched URL both when running
    // development server and when serving a deployment zipfile.
    cy.intercept("GET", "**/cypress/simple-pytchjr-project.zip", {
      fixture: "project-zipfiles/simple-pytchjr-project.zip",
    });
    cy.pytchResetDatabase({
      initialUrl: "/suggested-demo/cypress/simple-pytchjr-project",
    });
    cy.get("button").contains("Demo").click();
    cy.pytchGreenFlag();
  });

  type TestFun = (
    program: StructuredProgram,
    actions: Actions<IActiveProject>
  ) => void | Promise<void>;

  const withPytchJrProgramIt = (title: string, fn: TestFun) =>
    it(title, () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.window().then((window: any) => {
        const pytchCy = window.PYTCH_CYPRESS;
        const program: StructuredProgram = pytchCy.currentProgram.program;
        const actions: Actions<IActiveProject> = pytchCy.currentProgramActions;
        fn(program, actions);
      })
    );

  withPytchJrProgramIt("switches to error tab on error", (program, actions) => {
    const snake = program.actors[1];
    actions.setHandlerPythonCode({
      actorId: snake.id,
      handlerId: snake.handlers[0].id,
      code: 'print(3 + "a")\n',
    });

    // I /think/ this has now updated the store, which is what the build
    // process uses, so we don't have to wait for the DOM to update with
    // the new code.
    cy.get(".ActorCard.kind-stage").click();
    cy.get(".Junior-ActorProperties-container").contains("Sounds").click();
    cy.get(".Junior-InfoPanel").contains("Output").click();
    cy.pytchGreenFlag();

    cy.pytchShouldShowJuniorErrorCard(
      "unsupported operand type(s)",
      "user-space"
    );

    cy.get(".go-to-line").should("have.length", 1).click();
    cy.get(".ActorCard").eq(1).should("have.class", "isFocused");
    cy.contains('3 + "a"').should("be.visible");
  });
});
