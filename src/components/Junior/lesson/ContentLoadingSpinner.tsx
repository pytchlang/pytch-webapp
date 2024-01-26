import React from "react";
import { EmptyProps } from "../../../utils";
import { Spinner } from "react-bootstrap";

export const ContentLoadingSpinner: React.FC<EmptyProps> = () => {
  return (
    <div className="Junior-LessonContent-container">
      <div className="spinner-container">
        <Spinner animation="border" />
      </div>
    </div>
  );
};
