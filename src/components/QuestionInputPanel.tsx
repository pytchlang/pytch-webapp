import React, { ChangeEvent, useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import { focusOrBlurFun, submitOnEnterKeyFun } from "../utils";

import Form from "react-bootstrap/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const QuestionInputPanel = () => {
  const state = useStoreState((state) => state.userTextInput.state);
  const maybePrompt = useStoreState((state) => state.userTextInput.prompt);
  const answer = useStoreState((state) => state.userTextInput.answer);
  const { setAnswer, submit } = useStoreActions(
    (actions) => actions.userTextInput
  );

  const isInteractable = state === "interactable";

  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  useEffect(focusOrBlurFun(inputRef, isInteractable, isInteractable));

  if (!isInteractable) {
    return null;
  }

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) =>
    setAnswer(evt.target.value);

  const submitAndYieldFocus = () => {
    submit();

    // Give the focus back to the stage (which in fact means the
    // speech-bubble layer).  If another question is queued, we'll
    // take focus back when it's rendered, via the focusOrBlurFun()
    // call above.
    document.getElementById("pytch-speech-bubbles")?.focus();
  };

  const handleKeyPress = submitOnEnterKeyFun(submitAndYieldFocus, true);

  return (
    <div className="question-and-answer">
      {maybePrompt == null ? null : <div className="prompt">{maybePrompt}</div>}
      <div className="input">
        <Form.Control
          ref={inputRef}
          type="text"
          value={answer}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          tabIndex={-1}
        ></Form.Control>
        <div className="font-container">
          <FontAwesomeIcon
            className="check-icon fa-lg"
            icon="check-square"
            onClick={submitAndYieldFocus}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionInputPanel;
