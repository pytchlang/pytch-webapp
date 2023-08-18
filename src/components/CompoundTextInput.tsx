import React, { useState, forwardRef, ForwardRefRenderFunction } from "react";
import Form from "react-bootstrap/Form";
import { assertNever } from "../utils";
import {
  FormatFragment,
  FormatSpecifier,
  uniqueUserInputFragment,
} from "../model/compound-text-input";

type CompoundTextInputProps = {
  formatSpecifier: FormatSpecifier;
  onNewCombinedValue: (combinedValue: string) => void;
  onEnterKey: () => void;
};
const CompoundTextInput_: ForwardRefRenderFunction<
  HTMLInputElement,
  CompoundTextInputProps
> = ({ formatSpecifier, onNewCombinedValue, onEnterKey }, ref) => {
  const uiFragment = uniqueUserInputFragment(formatSpecifier);
  const [uiValue, setUiValue] = useState(uiFragment.initialValue);

  const handleUiChange: React.ChangeEventHandler<HTMLInputElement> = (evt) => {
    const uiValue = evt.target.value;
    setUiValue(uiValue);
    onNewCombinedValue(uiValue);
  };

  const handleUiKeyPress: React.KeyboardEventHandler = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      onEnterKey();
    }
  };

  // Define this locally to avoid having to pass things like
  // handleUiChange down to a standalone function.  We rely on the
  // uniqueness of the "user-input" fragment, as enforced by
  // uniqueUserInputFragment() above.
  const fragmentComponent = (key: string, fragment: FormatFragment) => {
    switch (fragment.kind) {
      case "user-input":
        return (
          <Form.Control
            key={key}
            type="text"
            value={uiValue}
            placeholder={fragment.placeholder}
            onChange={handleUiChange}
            onKeyDown={handleUiKeyPress}
            ref={ref}
            tabIndex={-1}
          />
        );
      case "literal":
        return (
          <span key={key} className="literal-fragment">
            {fragment.value}
          </span>
        );
      default:
        return assertNever(fragment);
    }
  };

  return (
    <Form>
      <div className="CompoundTextInput">
        {formatSpecifier.map((fragment, idx) =>
          fragmentComponent(idx.toString(), fragment)
        )}
      </div>
    </Form>
  );
};

export const CompoundTextInput = forwardRef(CompoundTextInput_);
