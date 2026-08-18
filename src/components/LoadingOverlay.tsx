import React from "react";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type LoadingOverlayProps = {
  show: boolean;
  spinnerClass?: string;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  spinnerClass,
}) => {
  const { t } = useTranslation("common");

  if (!show) return null;

  return (
    <div className="loading-in-progress">
      <div className="background"></div>
      <div
        className="content"
        aria-label={t("loading-content.label")}
        role="status"
      >
        <Spinner
          aria-hidden="true"
          animation="border"
          className={spinnerClass}
        />
      </div>
    </div>
  );
};
