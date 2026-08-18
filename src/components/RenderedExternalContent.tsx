import React from "react";
import { useStoreState } from "../store";
import { State } from "easy-peasy";
import { ContentFetchState } from "../model/external-json-data";
import { IPytchAppModel } from "../model";
import { FetchedResourceKind } from "../model/fetched-resource";
import { assertNever } from "../utils";
import { ErrorFetchingSomething } from "./ErrorFetchingSomething";
import { ContentLoadingSpinner } from "./Junior/ContentLoadingSpinner";

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
  resourceKeySuffix: FetchedResourceKind | false;
} & ContentRenderer<ContentT>;

/** Render a piece of externally-fetched content, showing a spinner
 * while the fetch is in progress, and an error panel if it failed.  The
 * content itself is rendered by `renderContent()`, which is given the
 * fetched content and should return the rendered node.
 *
 * `renderContent()` should return an element of a component defined at
 * module level; a component defined inline is a new type each time, and
 * so React remounts the subtree on every render.
 *
 * As a shortcut for the common case where the content is rendered by a
 * component taking exactly one `content` prop, that component can be
 * given as `contentComponent` instead.  Supply exactly one of the two.
 */
export function RenderedExternalContent<ContentT>(
  props: MaybeContentProps<ContentT>
): React.ReactNode {
  const contentFetchState = useStoreState(props.fetchStateMapper);

  switch (contentFetchState.state) {
    case "idle":
    case "requesting":
      return <ContentLoadingSpinner />;
    case "available": {
      const content = contentFetchState.content;
      return props.renderContent != null
        ? props.renderContent(content)
        : React.createElement(props.contentComponent, { content });
    }
    case "error": {
      const resourceKeySuffix = props.resourceKeySuffix;
      return (
        resourceKeySuffix !== false && (
          <ErrorFetchingSomething resourceKeySuffix={resourceKeySuffix} />
        )
      );
    }
    default:
      return assertNever(contentFetchState);
  }
}
