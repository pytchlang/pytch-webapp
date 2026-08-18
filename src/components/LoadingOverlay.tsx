import React from "react";
import { ContentLoadingSpinner } from "./Junior/ContentLoadingSpinner";

type LoadingOverlayProps = {
  show: boolean;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="loading-in-progress">
      <div className="background"></div>
      <ContentLoadingSpinner />
    </div>
  );
};
