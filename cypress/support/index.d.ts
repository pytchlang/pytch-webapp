type ContentMatch = string | RegExp;

declare namespace Cypress {
  interface Chainable {
    /** Reset the "pytch" storage database to be empty apart from one
     * project, which has one sample image asset and one sample sound
     * asset. */
    pytchResetDatabase(): Chainable<Element>;

    /** Reset the "pytch" storage database, then navigate to the sole
     * project created as part of the seeding. */
    pytchExactlyOneProject(): Chainable<Element>;

    /** Build the current state of the project via the BUILD button. */
    pytchBuild(): Chainable<Element>;

    /** Set the code-editor's content to the given code (after
     * de-indenting it), and then build the project.  This may result in
     * build errors, or in a successfully-built project. */
    pytchBuildCode(rawCode: string): Chainable<Element>;

    /** Assert that the "Output" pane contains the given fragment. */
    pytchStdoutShouldContain(match: ContentMatch): Chainable<Element>;

    /** Assert that the "Errors" pane is active and contains an error
     * card containing the given fragment.  */
    pytchShouldShowErrorCard(match: ContentMatch): Chainable<Element>;
  }
}
