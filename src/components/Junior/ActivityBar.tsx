import React, { KeyboardEventHandler, useRef } from "react";
import {
  ActivityContentState,
  ActivityBarTabKey,
} from "../../model/junior/edit-state";
import { useJrEditActions, useJrEditState } from "./hooks";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-common-types";
import { useHasLinkedLesson, useHasLinkedSpecimen } from "./lesson/hooks";
import { assertNever, clampInclusive, EmptyProps } from "../../utils";
import { useStoreState } from "../../store";
import { Nav } from "react-bootstrap";

type TabKeyUiDetails = { icon: IconName; tooltip: string };

const uiDetailsFromTabKeyLut = new Map<ActivityBarTabKey, TabKeyUiDetails>([
  ["helpsidebar", { icon: "question-circle", tooltip: "Scratch/Python help" }],
  ["lesson", { icon: "book", tooltip: "Lesson content" }],
  ["tutorial", { icon: "book", tooltip: "Tutorial content" }],
  ["specimen", { icon: "book", tooltip: "Lesson information" }],
]);

function uiDetailsFromTabKey(tab: ActivityBarTabKey): TabKeyUiDetails {
  const mDetails = uiDetailsFromTabKeyLut.get(tab);
  if (mDetails == null) {
    throw new Error(`unrecognised tab-key name "${tab}"`);
  }
  return mDetails;
}

const tabIsActive = (tab: ActivityBarTabKey, barState: ActivityContentState) =>
  barState.kind === "expanded" && barState.tab === tab;

const tabIsFocusable = (
  tabIndex: number,
  tab: ActivityBarTabKey,
  barState: ActivityContentState
) => {
  switch (barState.kind) {
    case "collapsed":
      return tabIndex === 0;
    case "expanded":
      return tab === barState.tab;
    default:
      return assertNever(barState);
  }
};

const tabIsGlobalSteerFocusTarget = (
  tabIndex: number,
  barState: ActivityContentState
) => {
  switch (barState.kind) {
    case "collapsed":
      return tabIndex === 0;
    case "expanded":
      return false;
    default:
      return assertNever(barState);
  }
};

type ActivityBarTabProps = {
  tab: ActivityBarTabKey;
  isActive: boolean;
  isTabFocusable: boolean;
  isGlobalSteerFocusTarget: boolean;
};
const ActivityBarTab: React.FC<ActivityBarTabProps> = ({
  tab,
  isActive,
  isTabFocusable,
  isGlobalSteerFocusTarget,
}) => {
  const collapseAction = useJrEditActions((a) => a.collapseActivityContent);
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  const onClick = isActive ? () => collapseAction() : () => expandAction(tab);
  const uiDetails = uiDetailsFromTabKey(tab);
  const classes = classNames("ActivityBarTab", { isActive }, `tab-key-${tab}`);
  const tabIndex = isTabFocusable ? 0 : -1;

  const buttonClasses = classNames(
    "tabkey-icon",
    isGlobalSteerFocusTarget && "gfs__activity-bar-or-content"
  );

  return (
    <li className={classes} onClick={onClick}>
      <button
        className={buttonClasses}
        tabIndex={tabIndex}
        id={`pytch:activity-bar-tab:tab:${tab}`}
        role="tab"
        aria-controls={`pytch:activity-bar-tab:tabpanel:${tab}`}
        aria-selected={isActive}
        data-activity-bar-tab={tab}
      >
        <FontAwesomeIcon icon={uiDetails.icon} />
      </button>
      <div className="tabkey-tooltip">{uiDetails.tooltip}</div>
    </li>
  );
};

export const ActivityBar: React.FC<EmptyProps> = () => {
  const navRef = useRef<HTMLUListElement>(null);
  const activityContentState = useJrEditState((s) => s.activityContentState);
  const pendingActionsExist = useStoreState(
    (s) => s.activeProject.pendingSyncActionsExist
  );
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  // TODO: Should the computation of the list of valid activity-tab-keys
  // be part of the model?
  const hasLinkedLesson = useHasLinkedLesson();
  const hasLinkedSpecimen = useHasLinkedSpecimen();
  const hasLinkedTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial != null
  );

  const onKeyDown: KeyboardEventHandler = (evt) => {
    const navUl = navRef.current;
    if (navUl == null) return;

    const dFocus = (() => {
      switch (evt.key) {
        case "ArrowLeft":
        case "ArrowUp":
          return -1;
        case "ArrowRight":
        case "ArrowDown":
          return 1;
        default:
          return 0;
      }
    })();
    if (dFocus === 0) return;

    const allTabs = Array.from(
      navUl.querySelectorAll<HTMLButtonElement>(":scope .tabkey-icon")
    );

    const mFocusedIdx = allTabs.findIndex(
      (tab) => tab.getAttribute("tabindex") === "0"
    );
    if (mFocusedIdx === -1) return; // Shouldn't happen.

    const maxTabIdx = allTabs.length - 1;
    const newFocusIdx = clampInclusive(mFocusedIdx + dFocus, 0, maxTabIdx);

    const newFocusedTab = allTabs[newFocusIdx];
    newFocusedTab.focus();

    if (activityContentState.kind === "expanded") {
      const tab = newFocusedTab.dataset.activityBarTab;
      if (tab != null) {
        expandAction(tab as ActivityBarTabKey);
      }
    }

    evt.preventDefault();
  };

  const tabs: Array<ActivityBarTabKey> = hasLinkedLesson
    ? ["helpsidebar", "lesson"]
    : hasLinkedSpecimen
    ? ["helpsidebar", "specimen"]
    : hasLinkedTutorial
    ? ["helpsidebar", "tutorial"]
    : ["helpsidebar"];

  const syncClasses = classNames("sync-indicator", { pendingActionsExist });
  return (
    <div className="ActivityBar">
      <Nav
        as="ul"
        className="activity-bar-tabs"
        ref={navRef}
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab, tabIdx) => (
          <ActivityBarTab
            key={tab}
            tab={tab}
            isActive={tabIsActive(tab, activityContentState)}
            isTabFocusable={tabIsFocusable(tabIdx, tab, activityContentState)}
            isGlobalSteerFocusTarget={tabIsGlobalSteerFocusTarget(
              tabIdx,
              activityContentState
            )}
          />
        ))}
      </Nav>
      <div className={syncClasses}>
        <FontAwesomeIcon icon="arrows-rotate" />
      </div>
    </div>
  );
};
