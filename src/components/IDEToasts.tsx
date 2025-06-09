import React from "react";
import { Toast } from "react-bootstrap";
import {
  KeyedNotableChange,
  notableChangeDescription,
} from "../model/notable-changes";

type IDEToastProps = {
  keyedChange: KeyedNotableChange;
};
const IDEToast: React.FC<IDEToastProps> = ({ keyedChange }) => {
  const change = keyedChange.change;
  const description = notableChangeDescription(change);
  return (
    <Toast>
      <Toast.Header>
        <strong className="me-auto">{description.header}</strong>
      </Toast.Header>
      <Toast.Body>{description.body}</Toast.Body>
    </Toast>
  );
};

export const IDEToasts: React.FC<object> = () => {
};
