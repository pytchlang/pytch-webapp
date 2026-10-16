import React, {
  ChangeEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  useId,
} from "react";
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
  const formLabelId = `tss__${useId()}`;

  // Bit of trial and error to get this set of functions working.  The
  // complication is that we want the overall Form.Label to be clickable
  // as opposed to just the switch and its label, and to be what gets
  // focus.

  const onLabelKeyDown: KeyboardEventHandler = (evt) => {
    if (evt.key === " " || evt.key === "Enter") {
      setBoolState(!boolState);
    }
  };

  const onLabelClick = () => {
    setBoolState(!boolState);
  };

  const labelContent = (
    <span className="current-state-label" onClick={onLabelClick}>
      <span className="when-true">{renderedSpec.trueStatus}</span>
      <span className="when-false">{renderedSpec.falseStatus}</span>
    </span>
  );

  const onSwitchChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setBoolState(evt.target.checked);
  };

  // We want the whole label to be focused, not the switch itself.
  const onSwitchClick: MouseEventHandler = () => {
    document.getElementById(formLabelId)?.focus();
  };

  // The onClick handler for the <Form.Check> seems to also handle
  // clicks on the containing <Form.Label>.  Looks like native
  // behaviour?

  const cls = classNames("TwoStateSwitch", className);
  return (
    <Form className={cls}>
      <Form.Label
        id={formLabelId}
        className="p-2"
        tabIndex={0}
        onKeyDown={onLabelKeyDown}
      >
        <span className="pe-5 fw-bold">{renderedSpec.question}</span>
        <Form.Check
          type="switch"
          tabIndex={-1}
          label={labelContent}
          checked={boolState}
          aria-checked={boolState}
          onChange={onSwitchChange}
          onClick={onSwitchClick}
        />
      </Form.Label>
    </Form>
  );
};
