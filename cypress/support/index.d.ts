declare namespace Cypress {
  interface Chainable {
    /** Reset the "pytch" storage database to be empty. */
    pytchResetDatabase(): Chainable<Element>;

    /** Reset the "pytch" storage database, then navigate to a
     * newly-created project with the given name. */
    pytchExactlyOneProject(projectName: string): Chainable<Element>;
  }
}
