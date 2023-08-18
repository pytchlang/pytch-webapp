import React, { useState, forwardRef, ForwardRefRenderFunction } from "react";
import {
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
};

export const CompoundTextInput = forwardRef(CompoundTextInput_);
