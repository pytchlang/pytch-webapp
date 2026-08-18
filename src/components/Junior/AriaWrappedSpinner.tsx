import React from "react";
import classNames from "classnames";
import Spinner from "react-bootstrap/Spinner";
import { useTranslation } from "react-i18next";
import { assertNever } from "../../utils";

type AriaWrappedSpinnerProps = {
  kind: "loading" | "working";
  wrapperDivClass?: string;
  wrapperDivStyle?: React.CSSProperties;
};
export const AriaWrappedSpinner: React.FC<AriaWrappedSpinnerProps> = ({
  kind,
  wrapperDivClass,
  wrapperDivStyle,
}) => {
  const { t } = useTranslation("common");

  const labelKey = (() => {
    switch (kind) {
      case "loading":
        return "loading-content.label" as const;
      case "working":
        return "working.title" as const;
      default:
        return assertNever(kind);
    }
  })();

  const divClass = classNames(
    "spinner-container mx-auto my-3 text-center",
    wrapperDivClass
  );

  return (
    <div
      aria-label={t(labelKey)}
      role="status"
      className={divClass}
      style={wrapperDivStyle}
    >
      <Spinner aria-hidden="true" animation="border" />
    </div>
  );
};
