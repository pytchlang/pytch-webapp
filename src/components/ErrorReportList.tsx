import React from "react";
import { useStoreState } from "../store";

interface ErrorReportProps {
  error: any; // TODO
}

const ErrorReport = ({ error }: ErrorReportProps) => {
  console.log(error);
  return <p>Eek!</p>;
};

const ErrorReportList = () => {
  const errors = useStoreState((state) => state.errorReportList.errors);

  return (
    <div className="ErrorReportList">
      {errors.map((error, index) => (
        <ErrorReport key={index} error={error} />
      ))}
    </div>
  );
};

export default ErrorReportList;
