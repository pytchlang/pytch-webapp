import { selectActorAspect, selectSprite, selectStage } from "../junior/utils";
import {
  assertFocus,
  assertHelpEntryVisibility,
  kShiftTab,
  realPress,
} from "./utils";

context("Kbd-nav of help sidebar", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  it("can navigate, reveal, hide with kbd", () => {
    selectActorAspect("Code");
    realPress(kShiftTab);

    realPress("ArrowDown");
    realPress("ArrowRight");
    assertFocus("help-sidebar", [2]);

    realPress("Enter");
    assertFocus("help-sidebar", [2]);

    realPress("ArrowDown");
    realPress("ArrowRight");
    assertFocus("help-sidebar", [2, 1]);

    realPress("ArrowRight", 6);
    assertFocus("help-sidebar", [4]);

    realPress("ArrowUp", 3);
    assertFocus("help-sidebar", [2, 4]);

    assertHelpEntryVisibility([2, 4], "hidden");
    realPress("Enter");
    assertHelpEntryVisibility([2, 4], "visible");
    realPress("Space");
    assertHelpEntryVisibility([2, 4], "hidden");

    realPress("ArrowRight", 5);
    assertFocus("help-sidebar", [6]);

    realPress("Home");
    assertFocus("help-sidebar", [0]);

    // If we add more help sections, the "9" here will need updating.
    realPress("End");
    assertFocus("help-sidebar", [9]);

    realPress("Tab");
    assertFocus("actor-property-tab", "code");

    realPress(kShiftTab);
    assertFocus("help-sidebar", [9]);

    cy.get(".HelpSidebarSection.category-variables").click();
    cy.get("details.pytch-method h2 code")
      .contains("self.show_variable")
      .parentsUntil("details")
      .eq(-1)
      .click();
    assertHelpEntryVisibility([7, 1], "hidden");
    assertHelpEntryVisibility([7, 2], "visible");
    assertHelpEntryVisibility([7, 3], "hidden");

    realPress("ArrowUp", 4);
    assertFocus("help-sidebar", [6]);

    realPress("ArrowUp", 4);
    assertFocus("help-sidebar", [2, 5]);

    realPress("Tab");
    assertFocus("actor-property-tab", "code");

    realPress(kShiftTab);
    assertFocus("help-sidebar", [2, 5]);

    realPress(kShiftTab);
    assertFocus("activity-tab", "helpsidebar");

    realPress("Tab");
    assertFocus("help-sidebar", [2, 5]);
  });

  it("can reach expanded help text with kbd", () => {
    selectActorAspect("Code");
    realPress(kShiftTab);
    assertFocus("help-sidebar", [0]);

    realPress("ArrowDown", 2);
    realPress("Enter");
    realPress("ArrowDown");
    assertFocus("help-sidebar", [2, 0]);

    // Expanded entry: its help text is between it and the next entry.
    realPress("Enter");
    assertHelpEntryVisibility([2, 0], "visible");
    realPress("ArrowDown");
    assertFocus("help-sidebar-text", [2, 0]);
    realPress("ArrowDown");
    assertFocus("help-sidebar", [2, 1]);
    realPress("ArrowUp");
    assertFocus("help-sidebar-text", [2, 0]);
    realPress("ArrowUp");
    assertFocus("help-sidebar", [2, 0]);

    // Collapsed entry: its help text is skipped.
    realPress("Enter");
    assertHelpEntryVisibility([2, 0], "hidden");
    realPress("ArrowDown");
    assertFocus("help-sidebar", [2, 1]);

    // Switching actor and back re-renders the help entries collapsed
    // (the section stays open).  The help text was bookmarked, but is
    // now hidden, so tabbing back into the help sidebar focuses the
    // summary of its entry.
    realPress("ArrowUp");
    realPress("Enter");
    realPress("ArrowDown");
    assertFocus("help-sidebar-text", [2, 0]);
    selectSprite("Snake");
    selectStage();
    selectActorAspect("Code");
    realPress(kShiftTab);
    assertFocus("help-sidebar", [2, 0]);
  });
});
