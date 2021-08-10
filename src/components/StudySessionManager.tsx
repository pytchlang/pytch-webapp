import React from "react";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Form from "react-bootstrap/Form";
import { JoiningSessionState } from "../model/study-session";
import { useStoreActions } from "../store";
import { focusOrBlurFun } from "../utils";
import { SessionToken } from "../database/study-server";

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
  const [code, setCode] = useState("");
  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();

  const requestSession = useStoreActions(
    (actions) => actions.sessionState.requestSession
  );
  const setSession = useStoreActions(
    (actions) => actions.sessionState.setSession
  );

  const isActive = props.phase.status !== "awaiting-user-ok";
  const isInteractable = props.phase.status === "awaiting-user-input";

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(focusOrBlurFun(inputRef, isActive, isInteractable));

  const submit = () =>
    requestSession({
      studyCode: props.studyCode,
      participantCode: code,
    });

  const joinFun = (token: SessionToken) => () =>
    setSession({ token, next: "go-to-homepage" });

  const button = (() => {
    const phase = props.phase;
    switch (phase.status) {
      case "awaiting-user-input":
        return <Button onClick={submit}>Join</Button>;
      case "requesting-session":
        return <Button disabled>Joining...</Button>;
      case "awaiting-user-ok":
        return <Button onClick={joinFun(phase.token)}>OK</Button>;
    }
  })();

  const handleKeyPress: React.KeyboardEventHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      submit();
    }
  };

  const textPara = (() => {
    switch (props.phase.status) {
      case "awaiting-user-input":
      case "requesting-session":
        return <p>Please enter your participant code:</p>;
      case "awaiting-user-ok":
        return <p>You have successfully joined the study.</p>;
    }
  })();

  const needRetryPara =
    props.nFailedAttempts > 0 && props.phase.status !== "awaiting-user-ok";

  const retryPara = needRetryPara && (
    <p className="try-again-alert">
      Sorry, that participant code was not recognised. Please check it and try
      again.
    </p>
  );

  return (
    <div className="join-study-form-container">
      <Form>
        <h2>Pytch: Join study</h2>
        <p>Thank you for making Pytch better by taking part in this study.</p>
        {textPara}
        {props.phase.status !== "awaiting-user-ok" && (
          <Form.Control
            type="text"
            readOnly={props.phase.status !== "awaiting-user-input"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Participant code"
            tabIndex={-1}
            ref={inputRef}
          />
        )}
        {retryPara}
        <div className="buttons">{button}</div>
      </Form>
    </div>
  );
};

const JoinStudyFailure = () => {
  return (
    <div className="join-study-failure">
      <h2>Problem joining study</h2>
      <p>
        Sorry, something went wrong while trying to join the study. Please
        contact the Pytch team for help.
      </p>
    </div>
  );
};

const SignedOut = () => {
  return (
    <div className="signed-out-notice">
      <h2>Pytch</h2>

      <p>Thank you for taking part in the study!</p>
    </div>
  );
};

export const StudySessionManager = () => {
  return (
    <div className="App">
    </div>
  );
};
