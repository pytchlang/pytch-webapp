import React from "react";
import { ToastContainer, Toast } from "react-bootstrap";
import { useAllNotableChanges } from "./hooks/notable-changes";
import {
  KeyedNotableChange,
  notableChangeDescription,
} from "../model/notable-changes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type IDEToastProps = {
  keyedChange: KeyedNotableChange;
};
const IDEToast: React.FC<IDEToastProps> = ({ keyedChange }) => {
  const change = keyedChange.change;
  const description = notableChangeDescription(change);
  return (
    <Toast>
      <Toast.Header>
        <FontAwesomeIcon className="fa-xl me-2" icon="check-square" />
        <strong className="me-auto">{description.header}</strong>
      </Toast.Header>
      <Toast.Body>{description.body}</Toast.Body>
    </Toast>
  );
};

export const IDEToasts: React.FC<object> = () => {
  const keyedChanges = useAllNotableChanges();

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
          <IDEToast key={keyedChange.changeId} keyedChange={keyedChange} />
        ))}
      </ToastContainer>
    </div>
  );
};
