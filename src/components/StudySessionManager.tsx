import React from "react";
import Spinner from "react-bootstrap/Spinner";

const maybeJoinStudyCode = () => {
  const joinMatcher = new RegExp("/join/([0-9a-f-]*)$");
  const joinMatch = joinMatcher.exec(window.location.href);
  return joinMatch == null ? null : joinMatch[1];
};

const ActionPendingSpinner = () => {
  return (
    <div className="modal-waiting-spinner">
      <Spinner animation="border" variant="primary" />
    </div>
  );
};

export const StudySessionManager = () => {
  return (
    <div className="App">
    </div>
  );
};
