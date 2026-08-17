import React from "react";
import { useStoreState } from "../store";
import { State } from "easy-peasy";
import { ContentFetchState } from "../model/external-json-data";
import { IPytchAppModel } from "../model";
import { FetchedResourceKind } from "../model/fetched-resource";
import { assertNever } from "../utils";
import { ErrorFetchingSomething } from "./ErrorFetchingSomething";
import { Spinner } from "react-bootstrap";

type FetchStateMapper<ContentT> = (
  state: State<IPytchAppModel>
) => ContentFetchState<ContentT>;

type ContentComponentProps<ContentT> = {
  content: ContentT;
};
type ContentComponent<ContentT> = React.FC<ContentComponentProps<ContentT>>;

type MaybeContentProps<ContentT> = {
  fetchStateMapper: FetchStateMapper<ContentT>;
  contentComponent: ContentComponent<ContentT>;
  resourceKeySuffix: FetchedResourceKind;
};

export function RenderedExternalContent<ContentT>({
  fetchStateMapper,
  contentComponent,
  resourceKeySuffix,
}: MaybeContentProps<ContentT>): React.ReactNode {
  const contentFetchState = useStoreState(fetchStateMapper);

  switch (contentFetchState.state) {
    case "idle":
    case "requesting":
      return (
        <div className="spinner-container mt-3 text-center">
          <Spinner animation="border" />
        </div>
      );
    case "available":
      return React.createElement(contentComponent, {
        content: contentFetchState.content,
      });
    case "error":
      return <ErrorFetchingSomething resourceKeySuffix={resourceKeySuffix} />;
    default:
      return assertNever(contentFetchState);
  }
}
