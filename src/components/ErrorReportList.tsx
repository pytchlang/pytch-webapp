/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { createContext, createElement, use } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useStoreState } from "../store";
import Alert from "react-bootstrap/Alert";
import { IErrorReport } from "../model/ui";
import { getFlatAceController } from "../skulpt-connection/code-editor";
import { EmptyProps, failIfNull } from "../utils";
import { Button } from "react-bootstrap";
import {
  zAttributeWatcherErrorKey,
  zBuildErrorKey,
  zOneFrameErrorKey,
  zRenderErrorKey,
} from "../skulpt-connection/error-kinds";

type UserCodeErrorLocationProps = {
  lineNo: number;
  colNo: number | null;
};
export type UserCodeErrorLocationComponent =
  React.FC<UserCodeErrorLocationProps>;
const UserCodeErrorLocation: UserCodeErrorLocationComponent = ({
  lineNo,
  colNo,
}) => {
  const { t } = useTranslation("vm");

  const gotoLine = () => {
    console.log("go to line", lineNo, colNo);
    const controller = failIfNull(
      getFlatAceController(),
      "no AceController for going to line"
    );
    if (colNo != null) {
      controller.gotoLineAndColumn(lineNo, colNo);
    } else {
      controller.gotoLine(lineNo);
    }
  };

  const keySuffix = colNo == null ? "no-col" : "with-col";
  const key = `error.location.user-code.${keySuffix}` as const;

  return (
    <Button className="go-to-line" onClick={gotoLine}>
      {t(key, { replace: { lineNo, colNo } })}
    </Button>
  );
};

type SchedulerStepErrorIntroProps = {
  errorContext: any;
};
export type SchedulerStepErrorIntroComponent =
  React.FC<SchedulerStepErrorIntroProps>;
const SchedulerStepErrorIntro: SchedulerStepErrorIntroComponent = ({
  errorContext,
}) => {
  const keySuffix = zOneFrameErrorKey.parse(errorContext.target_class_kind);
  return (
    <p>
      <Trans
        ns="vm"
        i18nKey={`error.intro.one-frame.${keySuffix}`}
        values={{
          className: errorContext.target_class_name,
          methodName: errorContext.callable_name,
          eventLabel: errorContext.event_label,
        }}
      />
    </p>
  );
};

export type ErrorReportComponents = {
  userCodeErrorLocation: UserCodeErrorLocationComponent;
  schedulerStepErrorIntro: SchedulerStepErrorIntroComponent;
};

export const ComponentsContext = createContext<ErrorReportComponents>({
  userCodeErrorLocation: UserCodeErrorLocation,
  schedulerStepErrorIntro: SchedulerStepErrorIntro,
});

type InternalCodeErrorLocationProps = {
  filename: string;
  lineNo: number;
  colNo: number | null;
};
const InternalCodeErrorLocation: React.FC<InternalCodeErrorLocationProps> = ({
  filename,
  lineNo,
  colNo,
}) => {
  const keySuffix = colNo == null ? "no-col" : "with-col";
  const key = `error.location.internal.${keySuffix}` as const;

  return (
    <span>
      <Trans ns="vm" i18nKey={key} values={{ lineNo, colNo, filename }} />
    </span>
  );
};

type ErrorLocationProps = {
  lineNo: number;
  colNo?: number;
  filename: string;
  isUserCode: boolean;
};
const ErrorLocation: React.FC<ErrorLocationProps> = ({
  lineNo,
  colNo,
  filename,
  isUserCode,
}) => {
  const userCodeErrorLocationComponent =
    use(ComponentsContext).userCodeErrorLocation;

  return isUserCode ? (
    createElement(userCodeErrorLocationComponent, {
      lineNo,
      colNo: colNo ?? null,
    })
  ) : (
    <InternalCodeErrorLocation
      filename={filename}
      lineNo={lineNo}
      colNo={colNo ?? null}
    />
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
  const keySuffix = index === 0 ? "0" : index === 1 ? "1" : "other";

  return (
    <li className="stack-trace-frame-summary" key={index}>
      <Trans
        ns="vm"
        i18nKey={`error.traceback.frame.${keySuffix}`}
        components={{
          location: (
            <ErrorLocation
              lineNo={frame.lineno}
              colNo={frame.colno}
              filename={frame.filename}
              isUserCode={isUserCode}
            />
          ),
        }}
      />
    </li>
  );
};

const frameSummaries = (traceback: Array<any>) => {
  const maxFrameIndex = traceback.length - 1;
  let frames = traceback.map((frame: any, index: number) =>
    frameSummary(frame, maxFrameIndex - index)
  );
  frames.reverse();
  return frames;
};

const buildContextTraceback = (pytchError: any) => {
  if (pytchError.tp$name === "SyntaxError") {
    const rawFrame = pytchError.traceback[0];

    const traceback = [
      {
        filename: rawFrame.filename,
        lineno: pytchError.$lineno.v,
        colno: pytchError.$offset.v,
      },
    ];

    return frameSummaries(traceback);
  }

  const nTracebackFrames = pytchError.traceback.length;
  if (nTracebackFrames === 0) {
    return null;
  } else {
    return frameSummaries(pytchError.traceback);
  }
};

const runtimeContextTraceback = (pytchError: any) => {
  if (pytchError.traceback == null) return null;

  return frameSummaries(pytchError.traceback);
};

const buildErrorIntro = (errorContext: any) => {
  const phase = errorContext.phase;
  const keySuffix = zBuildErrorKey.parse(
    phase === "register-actor"
      ? `register-actor.${errorContext.phaseDetail.kind}`
      : phase === "import" ||
        phase === "create-project" ||
        phase === "gpio-setup"
      ? phase
      : "unknown"
  );

  return (
    <p>
      <Trans
        ns="vm"
        i18nKey={`error.intro.build.${keySuffix}`}
        values={{ className: errorContext.phaseDetail?.className }}
      />
    </p>
  );
};

const renderErrorIntro = (errorContext: any) => {
  const keySuffix = zRenderErrorKey.parse(errorContext.target_class_kind);
  return (
    <p>
      <Trans
        ns="vm"
        i18nKey={`error.intro.render.${keySuffix}`}
        values={{ className: errorContext.target_class_name }}
      />
    </p>
  );
};

const attributeWatchErrorIntro = (errorContext: any) => {
  const keySuffix = zAttributeWatcherErrorKey.parse(
    errorContext.owner_kind ?? "unknown"
  );
  return (
    <p>
      <Trans
        ns="vm"
        i18nKey={`error.intro.attribute-watcher.${keySuffix}`}
        values={{
          attributeName: errorContext.attribute_name,
          ownerName: errorContext.owner_name,
        }}
      />
    </p>
  );
};

type ErrorIntroProps = {
  errorContext: any;
};
const ErrorIntro: React.FC<ErrorIntroProps> = ({ errorContext }) => {
  const { t } = useTranslation("vm");
  const schedulerStepErrorIntroComponent =
    use(ComponentsContext).schedulerStepErrorIntro;

  switch (errorContext.kind) {
    case "build":
      return buildErrorIntro(errorContext);
    case "render":
      return renderErrorIntro(errorContext);
    case "one_frame":
      return createElement(schedulerStepErrorIntroComponent, { errorContext });
    case "attribute-watcher":
      return attributeWatchErrorIntro(errorContext);
    default:
      return <p>{t("error.intro.unknown")}</p>;
  }
};

type ErrorReportProps = {
  errorReport: IErrorReport;
};
const ErrorReport: React.FC<ErrorReportProps> = ({ errorReport }) => {
  const { t } = useTranslation("vm");
  const pytchError = errorReport.pytchError;
  const msg = simpleExceptionString(pytchError);

  const errorContext = errorReport.errorContext;
  const isBuildError = errorContext.kind === "build";

  const tracebackItems = isBuildError
    ? buildContextTraceback(pytchError)
    : runtimeContextTraceback(pytchError);

  // Build errors are expected to lack a traceback.  Attribute-watch
  // errors can have an empty traceback, e.g., for a non-existent
  // attribute.  A runtime error without a traceback is unexpected, and
  // we show a "sorry" message in that case.

  return (
    <li className="ErrorReportAlert-container">
      <Alert variant="danger" className="ErrorReportAlert">
        <ErrorIntro errorContext={errorContext} />
        <blockquote>
          <code>{msg}</code>
        </blockquote>
        {tracebackItems == null ? (
          isBuildError ? null : (
            <p>{t("error.traceback.no-info")}</p>
          )
        ) : tracebackItems.length === 0 ? (
          <p>{t("error.traceback.no-more-info")}</p>
        ) : (
          <>
            <p>{t("error.traceback.how-it-happened")}</p>
            <ol className="error-traceback">{tracebackItems}</ol>
            <p>
              {t(
                tracebackItems.length > 1
                  ? "error.traceback.which-raised-error"
                  : "error.traceback.raised-error"
              )}
            </p>
          </>
        )}
      </Alert>
    </li>
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

export const ErrorReportList: React.FC<EmptyProps> = () => {
  const { t } = useTranslation("vm");
  const errors = useStoreState((state) => state.errorReportList.errors);
  const context = contextFromErrors(errors);

  return (
    <div className="ErrorReportPane">
      <p className="error-pane-intro">{t(`error.pane-intro.${context}`)}</p>
      <ol className="ErrorReportList">
        {errors.map((errorReport, index) => (
          // eslint-disable-next-line @eslint-react/no-array-index-key
          <ErrorReport key={index} errorReport={errorReport} />
        ))}
      </ol>
    </div>
  );
};
