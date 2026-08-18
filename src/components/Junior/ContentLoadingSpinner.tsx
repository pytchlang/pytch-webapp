import React from "react";
import { EmptyProps } from "../../utils";
import Spinner from "react-bootstrap/Spinner";
import { useTranslation } from "react-i18next";

export const ContentLoadingSpinner: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("common");
  return (
    <div
      aria-label={t("loading-content.label")}
      role="status"
      className="spinner-container my-3 text-center"
    >
      <Spinner aria-hidden="true" animation="border" />
    </div>
  );
};
