import React from "react";
import { State } from "easy-peasy";
import { ContentFetchState } from "../model/external-json-data";
import { IPytchAppModel } from "../model";
import { FetchedResourceKind } from "../model/fetched-resource";

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
