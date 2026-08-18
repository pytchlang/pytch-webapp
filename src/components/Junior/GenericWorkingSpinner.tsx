import React from "react";
import { EmptyProps } from "../../utils";
import { AriaWrappedSpinner } from "./AriaWrappedSpinner";

export const GenericWorkingSpinner: React.FC<EmptyProps> = () => (
  <AriaWrappedSpinner kind="working" />
);
