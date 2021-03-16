import React from "react";

interface LoadingOverlayProps {
  show: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, children }) => {
  if (!show) return null;

  return (
    <div className="loading-in-progress">
      <div className="background"></div>
      <div className="content">{children}</div>
    </div>
  );
};

export default LoadingOverlay;
