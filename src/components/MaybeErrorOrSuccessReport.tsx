import React from "react";
import Alert from "react-bootstrap/Alert";

interface Props {
  maybeLastFailureMessage: string | null;
  attemptSucceeded: boolean;
}

export const MaybeErrorOrSuccessReport: React.FC<Props> = ({
  maybeLastFailureMessage,
  attemptSucceeded,
}) => {
  const maybeErrorReport = maybeLastFailureMessage && (
    <Alert variant="danger">
      <p>{maybeLastFailureMessage}</p>
    </Alert>
  );

  const maybeSuccessReport = attemptSucceeded ? (
    <Alert variant="success">
      <p>Added!</p>
    </Alert>
  ) : null;

  return (
    <>
      {maybeErrorReport}
      {maybeSuccessReport}
    </>
  );
};
