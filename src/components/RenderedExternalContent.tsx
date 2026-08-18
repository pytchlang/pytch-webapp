import React from "react";
import { useStoreState } from "../store";
import { State } from "easy-peasy";
import { ContentFetchState } from "../model/external-json-data";
import { IPytchAppModel } from "../model";
import { FetchedResourceKind } from "../model/fetched-resource";
import { assertNever } from "../utils";
import { ErrorFetchingSomething } from "./ErrorFetchingSomething";
import { Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type FetchStateMapper<ContentT> = (
  state: State<IPytchAppModel>
) => ContentFetchState<ContentT>;

type ContentComponentProps<ContentT> = {
  content: ContentT;
};
type ContentComponent<ContentT> = React.FC<ContentComponentProps<ContentT>>;

/** Choice of ways of rendering fetched content.  Exactly one of the two
 * slots must be supplied. */
type ContentRenderer<ContentT> =
  | {
      renderContent: (content: ContentT) => React.ReactNode;
      contentComponent?: never; // Ensure not supplied
    }
  | {
      renderContent?: never; // Ensure not supplied
      contentComponent: ContentComponent<ContentT>;
    };

type MaybeContentProps<ContentT> = {
  fetchStateMapper: FetchStateMapper<ContentT>;
  contentComponent: ContentComponent<ContentT>;
  resourceKeySuffix: FetchedResourceKind | false;
};

export function RenderedExternalContent<ContentT>({
  fetchStateMapper,
  contentComponent,
  resourceKeySuffix,
}: MaybeContentProps<ContentT>): React.ReactNode {
  const { t } = useTranslation("common");
  const contentFetchState = useStoreState(fetchStateMapper);

  switch (contentFetchState.state) {
    case "idle":
    case "requesting":
      return (
        <div
          aria-label={t("loading-content.label")}
          role="status"
          className="spinner-container mt-3 text-center"
        >
          <Spinner aria-hidden="true" animation="border" />
        </div>
      );
    case "available":
      return React.createElement(contentComponent, {
        content: contentFetchState.content,
      });
    case "error":
      return (
        resourceKeySuffix !== false && (
          <ErrorFetchingSomething resourceKeySuffix={resourceKeySuffix} />
        )
      );
    default:
      return assertNever(contentFetchState);
  }
}
