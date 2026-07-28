import React, { act, useEffect, useRef } from "react";
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
import { EmptyProps, tabIsActive} from "../../utils";
import { useStoreActions, useStoreState } from "../../store";
import { Nav } from "react-bootstrap";
import { kFocusGroupItemClassName } from "../../model/junior/grouped-focus";
import { useFocusContext } from "../hooks/focus-steering";
import { FocusGroupContainer } from "../FocusGroupContainer";

// TODO i18n
const iconAndLabelFromTabKey: Record<
  ActivityBarTabKey,
  { icon: IconName; label: string }
> = {
  lesson: { icon: "book", label: "Lesson" },
  tutorial: { icon: "book", label: "Tutorial" },
  specimen: { icon: "book", label: "Specimen" },
  info: { icon: "circle-info", label: "Info" },
  settings: { icon: "gear", label: "Settings" },
  work: { icon: "pen-to-square", label: "Work" },
  results: { icon: "flag", label: "Results" },
  demo: { icon: "play", label: "Demo" }
};

type ActivityBarTabProps = { tab: ActivityBarTabKey; isActive: boolean };
const ActivityBarTab: React.FC<ActivityBarTabProps> = ({ tab, isActive }) => {
  const { t } = useTranslation("ide");
  const focusContext = useFocusContext();

  const collapseAction = useJrEditActions((a) => a.collapseActivityContent);
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  const layoutStyle = useStoreState((state) => state.ideLayout.layoutStyle);
  const onClick = () => {
    if (isActive && layoutStyle !== "single-screen-vertical") {
      collapseAction();
    }
    else {
      expandAction(tab);
    }
  };

  const icon = iconAndLabelFromTabKey[tab].icon;
  const label = iconAndLabelFromTabKey[tab].label;
  const classes = classNames(
    "ActivityBarTab p-0",
    { isActive },
    `tab-key-${tab}`
  );
  const buttonClasses = classNames("mb-2 w-100", kFocusGroupItemClassName);

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
        aria-expanded={layoutStyle === "split-screen" ? isActive : undefined}
        data-activity-bar-tab={tab}
        disabled={layoutStyle === "single-screen-vertical" && isActive}
      >
        <div className={classNames("tabkey-icon-wrapper", { isActive })}>
          <FontAwesomeIcon
            icon={icon}
            className={classNames("tabkey-icon", { isActive })}
          />
        </div>
        <p
          className={classNames("pt-1 activity-bar-tab-label", {
            isActive,
          })}
        >
          {label}
        </p>
        {/*<FontAwesomeIcon icon={icon} />*/}
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

  const tabs: Array<ActivityBarTabKey> = useStoreState(
    (state) => state.ideLayout.tabs
  );
  const layoutStyle = useStoreState((state) => state.ideLayout.layoutStyle);
  const programKind = useStoreState(
    (state) => state.activeProject.project.program.kind
  );

  const setTabs = useStoreActions((actions) => actions.ideLayout.setTabs);

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

  useEffect(() => {
    const nextTabs: ActivityBarTabKey[] =
        hasLinkedLesson ?
            layoutStyle === "split-screen" ?
                ["info", "lesson", "settings"]
                : ["info", "lesson", "work", "results", "settings"]
      : hasLinkedSpecimen ?
            layoutStyle === "split-screen" ?
                ["info", "specimen", "settings"]
                : ["info", "specimen", "work", "results", "settings"]
      : hasLinkedTutorial ?
            layoutStyle === "split-screen" ?
                ["info", "tutorial", "settings"]
                : ["info", "tutorial", "work", "results", "settings"]
      : hasLinkedDemo ?
            layoutStyle === "split-screen" ?
                ["info", "demo", "settings"]
                : ["info", "demo", "work", "results", "settings"]
      : layoutStyle === "split-screen" ?
            ["info", "settings"]
            : ["info", "work", "results", "settings"];
    setTabs(nextTabs);
  }, [layoutStyle]);

  const singleScreenPanes: ActivityBarTabKey[] = ["work", "results"];

  const focusGroupExtraClass =
    activityContentState.kind === "collapsed" ? "gfs__help__container" : "";
  const syncClasses = classNames("sync-indicator", { pendingActionsExist });
  const { t } = useTranslation("ide");

  return (
    <FocusGroupContainer
      className={focusGroupExtraClass}
      groupedFocusKey="ActivityBar"
    >
      <div className="ActivityBar" role={"menubar"}>
        <Nav
          as="ul"
          className="activity-bar-tabs d-flex justify-content-center"
          role={"tablist"}
          aria-orientation={"vertical"}
          aria-label={t("activity-pane.navigation.aria-label")}
        >
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
