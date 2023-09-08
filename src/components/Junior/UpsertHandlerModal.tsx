import React from "react";
import {
  EventDescriptorKind,
} from "../../model/junior/structured-program";
import { useJrEditActions, useJrEditState } from "./hooks";
import classNames from "classnames";

type EventKindOptionProps = React.PropsWithChildren<{
  kind: EventDescriptorKind;
}>;
const EventKindOption: React.FC<EventKindOptionProps> = ({
  kind,
  children,
}) => {
  const chosenKind = useJrEditState(
    (s) => s.upsertHatBlockInteraction.chosenKind
  );
  const setChosenKind = useJrEditActions(
    (a) => a.upsertHatBlockInteraction.setChosenKind
  );

  const chosen = chosenKind === kind;
  const classes = classNames("EventKindOption", { chosen });

  return (
    <li className={classes} onClick={() => setChosenKind(kind)}>
      <div className="bump" />
      {children}
    </li>
  );
};
