import React, { useState, forwardRef, ForwardRefRenderFunction } from "react";
import {
  FormatSpecifier,
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
};

export const CompoundTextInput = forwardRef(CompoundTextInput_);
