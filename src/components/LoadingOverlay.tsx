import React, { PropsWithChildren } from "react";
import { Spinner } from "react-bootstrap";

type LoadingOverlayProps = {
  show: boolean;
  spinnerClass?: string;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  spinnerClass,
}) => {
  if (!show) return null;

  return (
    <div className="loading-in-progress">
      <div className="background"></div>
      <div className="content">
        <Spinner animation="border" className={spinnerClass} />
      </div>
    </div>
  );
};
