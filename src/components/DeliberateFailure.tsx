import React from "react";
import { useParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { ExceptionDisplay } from "./ExceptionDisplay";

function DeliberateFailure(): JSX.Element {
  const params = useParams();
  const message = params["*"];
  throw new Error(message);
}

/** This component should not show up in production.  No real harm
 * happens if a user does stumble across it, though. */
export function DeliberateFailureWithBoundary(): JSX.Element {
  return (
    <ErrorBoundary FallbackComponent={ExceptionDisplay}>
      <DeliberateFailure />
    </ErrorBoundary>
  );
}
