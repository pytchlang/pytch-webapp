import {
  assertActorNames,
  selectSprite,
  selectStage,
  settleModalDialog,
} from "../junior/utils";
import { assertModalWithTitle } from "../utils";
import {
  assertFocus,
  assertNoDropdownMenu,
  chooseCcMenuItem,
  kCtrlDot,
  kCtrlSlash,
  kShiftF10,
  kShiftTab,
  realPress,
  summonCcMenuByKbd,
} from "./utils";

context("Actor ccmenu operations", () => {
  beforeEach(() => {
    cy.pytchBasicJrProject();
  });

  const actorKindsAndSelectors = {
    stage: { actorKind: "stage", select: selectStage },
    sprite: { actorKind: "sprite", select: () => selectSprite("Snake") },
  };

  // Stage dropdown should have "rename" and "delete" disabled.
  const expStageEnabled = [true, true, true, false, false];
  const expSpriteEnabled = [true, true, true, true, true];
  [
    { ...actorKindsAndSelectors.stage, expEntriesEnabled: expStageEnabled },
    { ...actorKindsAndSelectors.sprite, expEntriesEnabled: expSpriteEnabled },
  ].forEach((spec) => {
    it(`correct items (en/dis)abled (${spec.actorKind})`, () => {
      spec.select();
      summonCcMenuByKbd();
      cy.get(".ActorCard a.dropdown-item").as("items").should("have.length", 5);
      spec.expEntriesEnabled.forEach((expEnabled, idx) => {
        const predicate = expEnabled ? "not.have.class" : "have.class";
        cy.get("@items").eq(idx).should(predicate, "disabled");
      });
    });
  });

  [
    { label: "rename", itemIndex: 3, modalHeaderMatch: "Rename Snake" },
    { label: "delete", itemIndex: 4, modalHeaderMatch: "Delete Snake?" },
  ].forEach((spec) => {
    it(`launch and cxl "${spec.label} sprite"`, () => {
      selectSprite("Snake");
      chooseCcMenuItem(spec.itemIndex);
      assertModalWithTitle(spec.modalHeaderMatch);
      settleModalDialog("Cancel");
      assertFocus("actor-card", 1);
    });
  });

  const ccmenuKeySpecs = [
    { label: "S-F10", key: kShiftF10 },
    { label: "C-/", key: kCtrlSlash },
    { label: "C-.", key: kCtrlDot },
  ];

  [
    { label: "esc", key: "Escape" as const },
    ...ccmenuKeySpecs,
  ].forEach((spec) =>
    it(`summon and cancel menu (${spec.label}) with kbd`, () => {
      selectSprite("Snake");
      summonCcMenuByKbd();
      realPress(spec.key);
      assertNoDropdownMenu();
      assertFocus("actor-card", 1);
    })
  );

  [
    { ...actorKindsAndSelectors.stage, actorIdx: 0 },
    { ...actorKindsAndSelectors.sprite, actorIdx: 1 },
  ].forEach((spec) => {
    it(`shift-tab off start cxls menu (${spec.actorKind})`, () => {
      spec.select();
      summonCcMenuByKbd();
      realPress("ArrowDown", 2);
      assertFocus("actor-card-menu-item", [spec.actorIdx, 2]);
      realPress(kShiftTab, 3);
      assertNoDropdownMenu();
      assertFocus("actor-card", spec.actorIdx);
    });

    it(`tab off end focuses add-sprite (${spec.actorKind})`, () => {
      spec.select();
      summonCcMenuByKbd();
      realPress("ArrowDown", 2);
      realPress("Tab", 3);
      assertNoDropdownMenu();
      assertFocus("add-sprite-button");
      realPress(kShiftTab);
      assertFocus("actor-card", spec.actorIdx);
    });
  });

  it("navigate ccmenu items", () => {
    selectStage();
    summonCcMenuByKbd();
    realPress("ArrowDown", 3);
    assertFocus("actor-card-menu-item", [0, 3]);
    realPress("ArrowUp", 2);
    assertFocus("actor-card-menu-item", [0, 1]);
    realPress("Home");
    assertFocus("actor-card-menu-item", [0, 0]);
    realPress("End");
    assertFocus("actor-card-menu-item", [0, 4]);
    realPress("Escape");
    assertFocus("actor-card", 0);
  });

  it("focus after rename", () => {
    selectSprite("Snake");
    chooseCcMenuItem(3);
    cy.get(".modal-body form input").as("input").should("have.focus");
    realPress(["Control", "A"]);
    const newSpriteName = "BlueAndYellowSnake";
    cy.get("@input").type(newSpriteName);
    realPress("Tab", 2);
    realPress("Enter");
    assertFocus("actor-card", 1);
    assertActorNames(["Stage", newSpriteName]);
  });

  [
    {
      label: "kbd",
      settle: () => settleModalDialog("DELETE"),
    },
    {
      label: "mouse",
      settle: () => {
        realPress("Tab");
        realPress("Enter");
      },
    },
  ].forEach((spec) =>
    it(`focus after delete (${spec.label})`, () => {
      selectSprite("Snake");
      chooseCcMenuItem(4); // Delete
      spec.settle();
      assertFocus("actor-card", 0);
    })
  );
});
