import React, { PropsWithChildren } from "react";
import { Button } from "react-bootstrap";

type RadioButtonOptionProps<OptionT extends string> = PropsWithChildren<{
  thisOption: OptionT;
  activeOption: OptionT;
  label: string;
  setActive(tag: OptionT): void;
}>;

export function RadioButtonOption<OptionT extends string>(
  props: RadioButtonOptionProps<OptionT>
): JSX.Element {
  const isActive = props.thisOption === props.activeOption;
  const variantPrefix = isActive ? "" : "outline-";
  const variant = `${variantPrefix}success`;

  return (
    <div className="RadioChoiceButton">
      <Button
        variant={variant}
        data-option-slug={props.thisOption}
        onClick={() => props.setActive(props.thisOption)}
      >
        {props.label}
      </Button>
      {props.children}
    </div>
  );
}
