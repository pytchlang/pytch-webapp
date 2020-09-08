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

const simpleExceptionString = (err: any) => {
  let simple_str = err.tp$name;
  if (err.args && err.args.v.length > 0) {
    simple_str += ": " + err.args.v[0].v;
  }
  return simple_str;
};

const frameSummary = (frame: any, index: number) => {
  const isUserCode = frame.filename == "<stdin>.py";
  const codeOrigin = isUserCode ? "your code" : <code>{frame.filename}</code>;

  const leadIn = index === 0 ? "" : index === 1 ? "called " : "which called ";
  return (
    <li key={index}>
      {leadIn}
      <ErrorLocation
        lineNo={frame.lineno}
        isFirst={index === 0}
        isUserCode={isUserCode}
      />{" "}
      of {codeOrigin}
    </li>
  );
};

const buildContextTraceback = (pytchError: any) => {
  const nTracebackFrames = pytchError.traceback.length;
  if (nTracebackFrames === 0) {
    // TODO: Can we get some context through to here about
    // whether we were trying to load images or sounds, or doing
    // something else?
    return [<li key={0}>maybe while loading images/sounds?</li>];
  } else {
    const innermostFrame = pytchError.traceback[0];
    return [frameSummary(innermostFrame, 0)];
  }
};

const runtimeContextTraceback = (pytchError: any) => {
  console.log(pytchError.traceback);
  const maxFrameIndex = pytchError.traceback.length - 1;
  let frames = pytchError.traceback.map((frame: any, index: number) => {
    return frameSummary(frame, maxFrameIndex - index);
  });
  frames.reverse();
  console.log("after reverse", frames);
  return frames;
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
