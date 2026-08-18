import React from "react";
import { EmptyProps } from "../../utils";
import { AriaWrappedSpinner } from "./AriaWrappedSpinner";

type GenericWorkingSpinnerProps = {
  wrapperDivClass?: string;
};
export const GenericWorkingSpinner: React.FC<GenericWorkingSpinnerProps> = ({
  wrapperDivClass,
}) => <AriaWrappedSpinner kind="working" wrapperDivClass={wrapperDivClass} />;
