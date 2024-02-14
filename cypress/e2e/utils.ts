/** Object with function properties to help with testing behaviour of
 * the Save button.  In most cases, tests should be able to use:
 *
 * * `shouldReactToInteraction(interaction)` — assert that the Save
 *   button is unlit; perform the given `interaction()`; assert that the
 *   Save button is lit; click it; assert that it's not lit.
 *
 * The following finer-grained functions also exist if more control is
 * needed:
 *
 * * `click()` — click the Save button
 * * `shouldShowNoUnsavedChanges()` — assert that the Save button is in
 *   its normal, unhighlighted state, indicating that there are no
 *   unsaved changes
 * * `shouldShowUnsavedChanges()` — assert that the Save button is in
 *   its highlighted state, indicating that there **are** unsaved
 *   changes
 *   */
export const saveButton = (() => {
  const button = () => cy.get("button.save-button");
  const assertClass = (cls: string) => () => button().should("have.class", cls);

  const click = () => button().click();
  const shouldShowNoUnsavedChanges = assertClass("no-changes-since-last-save");
  const shouldShowUnsavedChanges = assertClass("unsaved-changes-exist");

  return {
    click,
    shouldShowNoUnsavedChanges,
    shouldShowUnsavedChanges,
    shouldReactToInteraction(interaction: () => void) {
      shouldShowNoUnsavedChanges();
      interaction();
      shouldShowUnsavedChanges();
      click();
      shouldShowNoUnsavedChanges();
    },
  };
})();

export const launchDropdownAction = (
  projectName: string,
  actionName: string
) => {
  cy.get(".project-name")
    .contains(projectName)
    .parent()
    .parent()
    .parent()
    .within(() => {
      cy.get(".dropdown").click();
      cy.contains(actionName).click();
    });
};
