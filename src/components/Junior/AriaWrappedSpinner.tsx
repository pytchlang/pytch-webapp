import React from "react";
import Spinner from "react-bootstrap/Spinner";
import { useTranslation } from "react-i18next";
import { assertNever } from "../../utils";

type AriaWrappedSpinnerProps = {
  kind: "loading" | "working";
  wrapperDivStyle?: React.CSSProperties;
};
export const AriaWrappedSpinner: React.FC<AriaWrappedSpinnerProps> = ({
  kind,
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

  return (
    <div
      aria-label={t(labelKey)}
      role="status"
      className="spinner-container mx-auto my-3 text-center"
      style={wrapperDivStyle}
    >
      <Spinner aria-hidden="true" animation="border" />
    </div>
  );
};
