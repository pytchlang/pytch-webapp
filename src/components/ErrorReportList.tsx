import React from "react";
import { useStoreState } from "../store";

interface ErrorLocationProps {
  lineNo: number;
  isFirst: boolean;
  isUserCode: boolean;
}

const ErrorLocation = ({ lineNo, isFirst, isUserCode }: ErrorLocationProps) => {
  const gotoLine = () => {
    console.log("go to line", lineNo);
  };

  const lineText = isFirst ? "Line" : "line";

  return (
    <span onClick={isUserCode ? gotoLine : undefined}>
      {lineText} {lineNo}
    </span>
  );
};

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
