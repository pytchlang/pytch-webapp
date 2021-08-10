import React from "react";
import Spinner from "react-bootstrap/Spinner";
import { JoiningSessionState } from "../model/study-session";

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

const JoinStudyModal: React.FC<JoiningSessionState> = (props) => {
  const textPara = (() => {
    switch (props.phase.status) {
      case "awaiting-user-input":
      case "requesting-session":
        return <p>Please enter your participant code:</p>;
      case "awaiting-user-ok":
        return <p>You have successfully joined the study.</p>;
    }
  })();

  return (
    <div className="join-study-form-container">
      <Form>
        <h2>Pytch: Join study</h2>
        <p>Thank you for making Pytch better by taking part in this study.</p>
        {textPara}
      </Form>
    </div>
  );
};

export const StudySessionManager = () => {
  return (
    <div className="App">
    </div>
  );
};
