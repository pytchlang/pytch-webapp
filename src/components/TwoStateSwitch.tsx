import React, { ChangeEventHandler, KeyboardEventHandler, useId } from "react";
import { Form } from "react-bootstrap";
import classNames from "classnames";
import "./TwoStateSwitch.scss";
import { Trans, useTranslation } from "react-i18next";
import { I18nStringSpec } from "../model/i18n/core-types";
import { i18nTranslationOptions } from "../model/i18n/utils";

type TwoStateSwitchTexts = {
  question: React.JSX.Element;
  trueStatus: React.JSX.Element;
  falseStatus: React.JSX.Element;
};

export type TwoStateSwitchI18nSpec = I18nStringSpec & {
  keyPart:
    | "copy.switch.none"
    | "copy.switch.jr-tutorial"
    | "copy.switch.specimen"
    | "copy.switch.demo"
    | "add.media-library.switch"
    | "search.language-switch";
};

const useRenderedSpec = (spec: TwoStateSwitchI18nSpec): TwoStateSwitchTexts => {
  const { i18n } = useTranslation(spec.ns);

  const keyBase = spec.keyPart;
  const params = i18nTranslationOptions(i18n, spec);

  return {
    question: (
      <Trans i18nKey={`${keyBase}.question`} ns={spec.ns} values={params} />
    ),
    trueStatus: (
      <Trans i18nKey={`${keyBase}.true-status`} ns={spec.ns} values={params} />
    ),
    falseStatus: (
      <Trans i18nKey={`${keyBase}.false-status`} ns={spec.ns} values={params} />
    ),
  };
};

type TwoStateSwitchProps = {
  i18nSpec: TwoStateSwitchI18nSpec;
  boolState: boolean;
  setBoolState: (newState: boolean) => void;
  className?: string;
};
export const TwoStateSwitch: React.FC<TwoStateSwitchProps> = ({
  i18nSpec,
  boolState,
  setBoolState,
  className,
}) => {
  const renderedSpec = useRenderedSpec(i18nSpec);
  const baseId = `tss__${useId()}`;
  const questionId = `${baseId}__question`;
  const trueStatusId = `${baseId}__true-status`;
  const falseStatusId = `${baseId}__false-status`;

  // The <input> is the focusable element, with the switch role and the
  // question as its name.  The currently-shown status text is its
  // description, so a screen reader learns what the current state
  // means.  The status spans are aria-hidden to avoid their also being
  // read as plain content; a description can still come from a hidden
  // element as long as it is referenced directly.  The surrounding
  // <Form.Label> makes the whole area clickable, via the native label
  // behaviour.  When the state changes, so does the description, and
  // NVDA (at least) announces the new description as well as the new
  // state, so we need no live region.

  const onSwitchChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setBoolState(evt.target.checked);
  };

  // Space toggles a checkbox natively; also toggle on Enter.
  const onSwitchKeyDown: KeyboardEventHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      setBoolState(!boolState);
    }
  };

  const cls = classNames("TwoStateSwitch", className);
  return (
    <div className={cls}>
      <Form.Label className="p-2">
        <span id={questionId} className="pe-5 fw-bold">
          {renderedSpec.question}
        </span>
        <span className="switch-and-status">
          <Form.Check
            type="switch"
            role="switch"
            aria-labelledby={questionId}
            aria-describedby={boolState ? trueStatusId : falseStatusId}
            checked={boolState}
            onChange={onSwitchChange}
            onKeyDown={onSwitchKeyDown}
          />
          <span
            className={classNames("current-state-label", {
              "is-true": boolState,
            })}
          >
            <span id={trueStatusId} className="when-true" aria-hidden="true">
              {renderedSpec.trueStatus}
            </span>
            <span id={falseStatusId} className="when-false" aria-hidden="true">
              {renderedSpec.falseStatus}
            </span>
          </span>
        </span>
      </Form.Label>
    </div>
  );
};
