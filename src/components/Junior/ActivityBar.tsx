import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityContentState,
  ActivityBarTabKey,
} from "../../model/junior/edit-state";
import { useJrEditActions, useJrEditState } from "./hooks";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-common-types";
import {
  useHasLinkedDemo,
  useHasLinkedLesson,
  useHasLinkedSpecimen,
} from "./lesson/hooks";
import { EmptyProps } from "../../utils";
import { useStoreState } from "../../store";
import { Nav } from "react-bootstrap";
import { kFocusGroupItemClassName } from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";
import { FocusGroupContainer } from "../FocusGroupContainer";

const iconFromTabKey: Record<ActivityBarTabKey, IconName> = {
  helpsidebar: "question-circle",
  keynavhelp: "keyboard",
  i18n: "language",
  lesson: "book",
  tutorial: "book",
  specimen: "book",
  demo: "play",
};

const tabIsActive = (
  tab: ActivityBarTabKey,
  contentState: ActivityContentState
) => contentState.kind === "expanded" && contentState.tab === tab;

type ActivityBarTabProps = { tab: ActivityBarTabKey; isActive: boolean };
const ActivityBarTab: React.FC<ActivityBarTabProps> = ({ tab, isActive }) => {
  const { t } = useTranslation("ide");
  const focusContext = useFocusContext();

  const collapseAction = useJrEditActions((a) => a.collapseActivityContent);
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  const onClick = isActive ? () => collapseAction() : () => expandAction(tab);
  const icon = iconFromTabKey[tab];
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
        <FontAwesomeIcon icon={icon} />
      </button>
      <div className="tabkey-tooltip">{t(`activity-bar.tooltip.${tab}`)}</div>
    </li>
  );
};

export const ActivityBar: React.FC<EmptyProps> = () => {
  const activityContentState = useJrEditState((s) => s.activityContentState);
  const pendingActionsExist = useStoreState(
    (s) => s.activeProject.pendingSyncActionsExist
  );

  // TODO: Should the computation of the list of valid activity-tab-keys
  // be part of the model?  See also other places where these facts are represented:
  //
  // IDELayout component
  // Thunks bootForFlatProgram() and bootForProgram() in EditState

  const hasLinkedLesson = useHasLinkedLesson();
  const hasLinkedSpecimen = useHasLinkedSpecimen();
  const hasLinkedTutorial = useStoreState(
    (state) => state.activeProject.project?.trackedTutorial != null
  );
  const hasLinkedDemo = useHasLinkedDemo();

  const tabs: Array<ActivityBarTabKey> = hasLinkedLesson
    ? ["helpsidebar", "lesson", "keynavhelp", "i18n"]
    : hasLinkedSpecimen
    ? ["helpsidebar", "specimen", "keynavhelp", "i18n"]
    : hasLinkedTutorial
    ? ["helpsidebar", "tutorial", "keynavhelp", "i18n"]
    : hasLinkedDemo
    ? ["helpsidebar", "demo", "keynavhelp", "i18n"]
    : ["helpsidebar", "keynavhelp", "i18n"];

  const focusGroupExtraClass = classNames(
    "gfs__activitytabbar__container",
    activityContentState.kind === "collapsed" && "gfs__help__container"
  );

  const syncClasses = classNames("sync-indicator", { pendingActionsExist });
  return (
    <FocusGroupContainer
      className={focusGroupExtraClass}
      groupedFocusKey="ActivityBar"
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
    </FocusGroupContainer>
  );
};
