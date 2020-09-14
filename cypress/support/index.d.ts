declare namespace Cypress {
  interface Chainable {
    /** Reset the "pytch" storage database to be empty. */
    pytchResetDatabase(): Chainable<Element>;

    /** Reset the "pytch" storage database, then navigate to a
     * newly-created project with the given name. */
    pytchExactlyOneProject(projectName: string): Chainable<Element>;

    /** Set the code-editor's content to the given code (after
     * de-indenting it), and then build the project.  This may result in
     * build errors, or in a successfully-built project. */
    pytchBuildCode(rawCode: string): Chainable<Element>;
  }
}
