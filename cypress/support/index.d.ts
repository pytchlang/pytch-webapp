declare namespace Cypress {
  interface Chainable {
    /** Reset the "pytch" storage database to be empty. */
    pytchResetDatabase(): Chainable<Element>;
  }
}
