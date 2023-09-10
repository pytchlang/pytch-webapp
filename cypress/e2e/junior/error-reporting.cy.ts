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
});
