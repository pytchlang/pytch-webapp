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
import { EmptyProps } from "../../utils";
import { useStoreState } from "../../store";
import { Nav } from "react-bootstrap";
import {
  focusGroupContainerClass,
  kFocusGroupItemClassName,
} from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";

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

const tabIsActive = (
  tab: ActivityBarTabKey,
  contentState: ActivityContentState
) => contentState.kind === "expanded" && contentState.tab === tab;

type ActivityBarTabProps = { tab: ActivityBarTabKey; isActive: boolean };
const ActivityBarTab: React.FC<ActivityBarTabProps> = ({ tab, isActive }) => {
  const focusContext = useFocusContext();

  const collapseAction = useJrEditActions((a) => a.collapseActivityContent);
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  const onClick = isActive ? () => collapseAction() : () => expandAction(tab);
  const uiDetails = uiDetailsFromTabKey(tab);
  const classes = classNames("ActivityBarTab", { isActive }, `tab-key-${tab}`);
  const buttonClasses = classNames("tabkey-icon", kFocusGroupItemClassName);

  return (
    <li className={classes} onClick={onClick}>
      <button
        className={buttonClasses}
        tabIndex={-1}
        onClick={focusContext.onGroupItemClick}
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
  const focusContext = useFocusContext();

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

  const focusGroupExtraClass =
    activityContentState.kind === "collapsed" ? "gfs__help__container" : "";
  const divClasses = focusGroupContainerClass(focusGroupExtraClass);
  const syncClasses = classNames("sync-indicator", { pendingActionsExist });
  return (
    <div
      ref={focusContext.groupContainerRefCallback()}
      className={divClasses}
      data-grouped-focus-key="ActivityBar"
    >
      <div className="ActivityBar">
        <Nav as="ul" className="activity-bar-tabs">
          {tabs.map((tab) => (
            <ActivityBarTab
              key={tab}
              tab={tab}
              isActive={tabIsActive(tab, activityContentState)}
            />
          ))}
        </Nav>
        <div className={syncClasses}>
          <FontAwesomeIcon icon="arrows-rotate" />
        </div>
      </div>
    </div>
  );
};
