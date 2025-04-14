import React from "react";
import {
  ActivityContentState,
  ActivityBarTabKey,
} from "../../model/junior/edit-state";
import { useJrEditActions, useJrEditState } from "./hooks";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-common-types";
import { useHasLinkedLesson, useHasLinkedSpecimen } from "./lesson/hooks";
import { assertNever, EmptyProps } from "../../utils";
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

type ActivityBarTabProps = {
  tab: ActivityBarTabKey;
  isActive: boolean;
  isTabFocusable: boolean;
};
const ActivityBarTab: React.FC<ActivityBarTabProps> = ({
  tab,
  isActive,
  isTabFocusable,
}) => {
  const collapseAction = useJrEditActions((a) => a.collapseActivityContent);
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  const onClick = isActive ? () => collapseAction() : () => expandAction(tab);
  const uiDetails = uiDetailsFromTabKey(tab);
  const classes = classNames("ActivityBarTab", { isActive }, `tab-key-${tab}`);

  return (
    <div className={classes} onClick={onClick}>
      <div className="tabkey-icon">
        <FontAwesomeIcon icon={uiDetails.icon} />
      </div>
      <div className="tabkey-tooltip">{uiDetails.tooltip}</div>
    </div>
  );
};

export const ActivityBar: React.FC<EmptyProps> = () => {
  const activityContentState = useJrEditState((s) => s.activityContentState);
  const pendingActionsExist = useStoreState(
    (s) => s.activeProject.pendingSyncActionsExist
  );

  // TODO: Should the computation of the list of valid activity-tab-keys
  // be part of the model?
  const hasLinkedLesson = useHasLinkedLesson();
  const hasLinkedSpecimen = useHasLinkedSpecimen();
  const hasLinkedTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial != null
  );

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
      >
        {tabs.map((tab, tabIdx) => (
          <ActivityBarTab
            key={tab}
            tab={tab}
            isActive={tabIsActive(tab, activityContentState)}
            isTabFocusable={tabIsFocusable(tabIdx, tab, activityContentState)}
          />
        ))}
      </Nav>
      <div className={syncClasses}>
        <FontAwesomeIcon icon="arrows-rotate" />
      </div>
    </div>
  );
};
