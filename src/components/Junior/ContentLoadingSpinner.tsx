import React from "react";
import { EmptyProps } from "../../utils";
import { AriaWrappedSpinner } from "./AriaWrappedSpinner";

export const ContentLoadingSpinner: React.FC<EmptyProps> = () => (
  <AriaWrappedSpinner kind="loading" />
);
