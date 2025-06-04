import { createContext } from "react";
import { PytchProgramKind } from "../../model/pytch-program";

type FocusContextT = {
};

export const FocusContext = createContext<FocusContextT | null>(null);

export const createFocusContext = (
  _programKind: PytchProgramKind // Will use in due course
): FocusContextT => {
  return {
  };
};
