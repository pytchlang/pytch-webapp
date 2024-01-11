import React from "react";
import {
  ActivityContentState,
  ActivityBarTabKey,
} from "../../model/junior/edit-state";
import { useJrEditActions } from "./hooks";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-common-types";

type TabKeyUiDetails = { icon: IconName; tooltip: string };

const uiDetailsFromTabKeyLut = new Map<ActivityBarTabKey, TabKeyUiDetails>([
  ["helpsidebar", { icon: "question-circle", tooltip: "Scratch/Python help" }],
  ["lesson", { icon: "book", tooltip: "Lesson content" }],
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

type ActivityBarTabProps = { tab: ActivityBarTabKey; isActive: boolean };
const ActivityBarTab: React.FC<ActivityBarTabProps> = ({ tab, isActive }) => {
  const collapseAction = useJrEditActions((a) => a.collapseActivityContent);
  const expandAction = useJrEditActions((a) => a.expandActivityContent);

  const onClick = isActive ? () => collapseAction() : () => expandAction(tab);
  const uiDetails = uiDetailsFromTabKey(tab);
  const classes = classNames("ActivityBarTab", { isActive });

  return (
    <div className={classes} onClick={onClick}>
      <div className="tabkey-icon">
        <FontAwesomeIcon icon={uiDetails.icon} />
      </div>
      <div className="tabkey-tooltip">{uiDetails.tooltip}</div>
    </div>
  );
};
