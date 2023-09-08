import React from "react";
import {
  EventDescriptorKind,
} from "../../model/junior/structured-program";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

type KeyEditorProps = {
  displayName: string;
  onEditClick(): void;
};
const KeyEditor: React.FC<KeyEditorProps> = ({ displayName, onEditClick }) => {
  return (
    <div className="KeyEditor">
      <span className="key-button">
        {displayName}
        <span className="edit-button" onClick={onEditClick}>
          <FontAwesomeIcon icon="pencil-alt"></FontAwesomeIcon>
        </span>
      </span>
    </div>
  );
};
