import React from "react";
import { ToastContainer, Toast } from "react-bootstrap";
import {
  useActiveNotableChanges,
  useDeactivateChangeAction,
} from "./hooks/notable-changes";
import {
  KeyedNotableChange,
  notableChangeDescription,
} from "../model/notable-changes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type NotableChangeToastProps = {
  keyedChange: KeyedNotableChange;
};
const NotableChangeToast: React.FC<NotableChangeToastProps> = ({
  keyedChange,
}) => {
  const deactivateAction = useDeactivateChangeAction();

  const change = keyedChange.change;
  const description = notableChangeDescription(change);
  const deactivate = () => deactivateAction(keyedChange.changeId);
  return (
    <Toast onClose={deactivate}>
      <Toast.Header>
        <FontAwesomeIcon className="fa-xl me-2" icon="check-square" />
        <strong className="me-auto">{description.header}</strong>
      </Toast.Header>
      <Toast.Body>{description.body}</Toast.Body>
    </Toast>
  );
};

export const NotableChangeToasts: React.FC<object> = () => {
  const keyedChanges = useActiveNotableChanges();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="abs-0000"
      style={{ pointerEvents: "none" }}
    >
      <ToastContainer
        position="top-center"
        className="p-2"
        style={{ zIndex: 1 }}
      >
        {keyedChanges.map((keyedChange) => (
          <NotableChangeToast
            key={keyedChange.changeId}
            keyedChange={keyedChange}
          />
        ))}
      </ToastContainer>
    </div>
  );
};
