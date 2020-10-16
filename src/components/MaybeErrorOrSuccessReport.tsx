import React from "react";
import Alert from "react-bootstrap/Alert";

interface Props {
  messageWhenSuccess: string;
  maybeLastFailureMessage: string | null;
  attemptSucceeded: boolean;
}

export const MaybeErrorOrSuccessReport: React.FC<Props> = ({
  messageWhenSuccess,
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
      <p>{messageWhenSuccess}</p>
    </Alert>
  ) : null;

  return (
    <>
      {maybeErrorReport}
      {maybeSuccessReport}
    </>
  );
};
