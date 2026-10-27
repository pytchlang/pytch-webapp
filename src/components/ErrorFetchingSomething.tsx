import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useTranslation } from "react-i18next";
import "./ErrorFetchingSomething.scss";
import { FetchedResourceKind } from "../model/fetched-resource";

type ErrorFetchingSomethingProps = {
  resourceKeySuffix: FetchedResourceKind;
  ref?: React.Ref<HTMLDivElement>;
};
/** Explain that some resource could not be fetched.  The message
 * element is focusable (but not in the tab order), and is available
 * via `ref`, so that focus can be sent to it. */
export const ErrorFetchingSomething: React.FC<ErrorFetchingSomethingProps> = ({
  resourceKeySuffix,
  ref,
}) => {
  const { t } = useTranslation("errors");
  return (
    <div className="w-100 d-flex justify-content-center">
      <div className="ErrorFetchingSomething" ref={ref} tabIndex={-1}>
        <h1>
          <FontAwesomeIcon className="me-1" icon="exclamation-triangle" />
          {t("fetch-failure.title")}
        </h1>
        <p>{t("fetch-failure.intro")}</p>
        <ul>
          <li>{t(`fetch-failure.description.${resourceKeySuffix}`)}</li>
        </ul>
      </div>
    </div>
  );
};
