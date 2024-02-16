import { useStoreState } from "../../../store";
import { LinkedJrTutorial } from "../../../model/junior/jr-tutorial";

export const useHasLinkedLesson = (): boolean =>
  useStoreState((state) => {
    const loadState = state.activeProject.linkedContentLoadingState;

    return (
      (loadState.kind === "succeeded" &&
        loadState.content.kind === "jr-tutorial") ||
      (loadState.kind === "pending" &&
        loadState.contentRef.kind === "jr-tutorial")
    );
  });

export const useLinkedJrTutorial = (): LinkedJrTutorial =>
  useMappedLinkedJrTutorial((tutorial) => tutorial);

export function useMappedLinkedJrTutorial<Result>(
  mapContent: (tutorial: LinkedJrTutorial) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;

    if (contentState.kind !== "succeeded")
      throw new Error("linked lesson has not been loaded");

    if (contentState.content.kind !== "jr-tutorial")
      throw new Error("linked lesson is not suitable");

    return mapContent(contentState.content);
  }, eqResult);
}
