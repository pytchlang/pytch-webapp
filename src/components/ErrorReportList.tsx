import React from "react";
import { useStoreState } from "../store";
import Alert from "react-bootstrap/Alert";
import { IErrorReport } from "../model/ui";
import { aceController } from "../skulpt-connection/code-editor";
import { failIfNull } from "../utils";

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
    const controller = failIfNull(
      aceController,
      "no AceController for going to line"
    );
    controller.gotoLine(lineNo);
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
  if (err.tp$name == null) {
    return `[Internal Pytch error: ${err}]`;
  }

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
    <li className="stack-trace-frame-summary" key={index}>
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
    return null;
  } else {
    const innermostFrame = pytchError.traceback[0];
    return [frameSummary(innermostFrame, 0)];
  }
};

const runtimeContextTraceback = (pytchError: any) => {
  if (pytchError.traceback == null) return null;

  console.log(pytchError.traceback);
  const maxFrameIndex = pytchError.traceback.length - 1;
  let frames = pytchError.traceback.map((frame: any, index: number) =>
    frameSummary(frame, maxFrameIndex - index)
  );
  frames.reverse();
  console.log("after reverse", frames);
  return frames;
};

const buildErrorIntro = (errorContext: any) => {
  switch (errorContext.phase) {
    case "import":
      return <p>While building your code, Pytch encountered this error:</p>;
    case "create-project":
      return (
        <p>
          While creating the <code>Project</code> object, Pytch encountered this
          error:
        </p>
      );
    case "register-actor":
      return (
        <p>
          While setting up the {errorContext.phaseDetail.kind} called{" "}
          <code>{errorContext.phaseDetail.className}</code>, Pytch encountered
          this error:
        </p>
      );
    default:
      return (
        <p>
          At an unknown point of the build process, Pytch encountered this
          error:
        </p>
      );
  }
};

const renderErrorIntro = (errorContext: any) => {
  return (
    <p>
      While trying to draw a {errorContext.target_class_kind} of class “
      <code>{errorContext.target_class_name}</code>”, Pytch encountered this
      error:
    </p>
  );
};

const schedulerStepErrorIntro = (errorContext: any) => {
  return (
    <p>
      A {errorContext.target_class_kind} of class{" "}
      <code>{errorContext.target_class_name}</code> was running the method{" "}
      <code>{errorContext.callable_name}()</code> in response to the event{" "}
      <code>{errorContext.event_label}</code>, and encountered this error:
    </p>
  );
};

const errorIntro = (errorContext: any) => {
  switch (errorContext.kind) {
    case "build":
      return buildErrorIntro(errorContext);
    case "render":
      return renderErrorIntro(errorContext);
    case "one_frame":
      return schedulerStepErrorIntro(errorContext);
    default:
      return <p>In an unknown context, Pytch encountered this error:</p>;
  }
};

interface ErrorReportProps {
  errorReport: IErrorReport;
}

const ErrorReport = ({ errorReport }: ErrorReportProps) => {
  const pytchError = errorReport.pytchError;
  const msg = simpleExceptionString(pytchError);

  const errorContext = errorReport.errorContext;
  const isBuildError = errorContext.kind === "build";

  const tracebackItems = isBuildError
    ? buildContextTraceback(pytchError)
    : runtimeContextTraceback(pytchError);

  const intro = errorIntro(errorContext);

  return (
    <Alert variant="danger" className="ErrorReportAlert">
      {intro}
      <blockquote>
        <code>{msg}</code>
      </blockquote>
      {tracebackItems && (
        <>
          <p>This is how the error happened:</p>
          <ul>{tracebackItems}</ul>
          <p>{tracebackItems.length > 1 ? "which " : ""}raised the error.</p>
        </>
      )}
    </Alert>
  );
};

const contextFromErrors = (errors: Array<IErrorReport>) => {
  const isBuildError = (err: IErrorReport) => err.errorContext.kind === "build";
  const nBuildErrors = errors.filter(isBuildError).length;
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
