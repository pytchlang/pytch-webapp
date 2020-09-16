import React from "react";
import { useStoreState } from "../store";
import Alert from "react-bootstrap/Alert";
import { IErrorReport } from "../model/ui";
import { aceController } from "../skulpt-connection/code-editor";

interface ErrorLocationProps {
  lineNo: number;
  filename: string;
  isFirst: boolean;
  isUserCode: boolean;
}

const ErrorLocation = ({
  lineNo,
  filename,
  isFirst,
  isUserCode,
}: ErrorLocationProps) => {
  const gotoLine = () => {
    console.log("go to line", lineNo);
    if (aceController == null) {
      throw Error("no AceController for going to line");
    }
    aceController.gotoLine(lineNo);
  };

  const lineText = isFirst ? "Line" : "line";
  const codeOrigin = isUserCode ? (
    "your code"
  ) : (
    <span>
      <code>{filename}</code> (which is internal Pytch code)
    </span>
  );

  return (
    <span
      className={isUserCode ? "go-to-line" : undefined}
      onClick={isUserCode ? gotoLine : undefined}
    >
      {lineText} {lineNo} of {codeOrigin}
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
  const isUserCode = frame.filename === "<stdin>.py";

  const leadIn = index === 0 ? "" : index === 1 ? "called " : "which called ";
  return (
    <li key={index}>
      {leadIn}
      <ErrorLocation
        lineNo={frame.lineno}
        filename={frame.filename}
        isFirst={index === 0}
        isUserCode={isUserCode}
      />
    </li>
  );
};

const buildContextTraceback = (pytchError: any) => {
  const nTracebackFrames = pytchError.traceback.length;
  if (nTracebackFrames === 0) {
    // TODO: Can we get some context through to here about
    // whether we were trying to load images or sounds, or doing
    // something else?
    return null;
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
  errorReport: IErrorReport;
}

const ErrorReport = ({ errorReport }: ErrorReportProps) => {
  const pytchError = errorReport.pytchError;
  const msg = simpleExceptionString(pytchError);

  let tracebackItems =
    errorReport.threadInfo == null
      ? buildContextTraceback(pytchError)
      : runtimeContextTraceback(pytchError);

  const threadInfo = errorReport.threadInfo;
  const isBuildError = threadInfo.kind === "build";

  const errorSource =
    threadInfo == null ? (
      "Your code"
    ) : (
      <span>
        A <i>{threadInfo.target_class_kind}</i> of class{" "}
        <i>{threadInfo.target_class_name}</i>
      </span>
    );

  const errorTrigger =
    threadInfo == null ? (
      ""
    ) : (
      <span>
        {" "}
        in the method <code>{threadInfo.callable_name}()</code> running because
        of <code>{threadInfo.event_label}</code>
      </span>
    );

  return (
    <Alert variant="danger" className="ErrorReportAlert">
      <p>{errorSource} had a problem.</p>
      <p>The error</p>
      <blockquote>
        <code>{msg}</code>
      </blockquote>
      <p>occurred{errorTrigger}.</p>
      {tracebackItems && (
        <>
          <ul>{tracebackItems}</ul>
          <p>{tracebackItems.length > 1 ? "which " : ""}raised the error.</p>
        </>
      )}
    </Alert>
  );
};

const contextFromErrors = (errors: Array<IErrorReport>) => {
  const nBuildErrors = errors.filter((er) => er.threadInfo == null).length;
  const nRuntimeErrors = errors.length - nBuildErrors;

  if (nBuildErrors === 0) {
    if (nRuntimeErrors === 0) {
      throw Error("no errors to infer context from");
    }
    return "runtime";
  } else {
    if (nRuntimeErrors > 0) {
      throw Error("mixed build/runtime contexts in error list");
    }
    return "build";
  }
};

const ErrorReportList = () => {
  const errors = useStoreState((state) => state.errorReportList.errors);
  const context = contextFromErrors(errors);

  const introText =
    context === "build"
      ? "Your project could not be started because:"
      : "Your project has stopped because:";
  const intro = <p className="error-pane-intro">{introText}</p>;

  return (
    <div className="ErrorReportPane">
      {intro}
      <div className="ErrorReportList">
        {errors.map((errorReport, index) => (
          <ErrorReport key={index} errorReport={errorReport} />
        ))}
      </div>
    </div>
  );
};

export default ErrorReportList;
