import { useStoreState } from "../../../store";
import { LinkedJrTutorial } from "../../../model/junior/jr-tutorial";

export const useHasLinkedLesson = (): boolean =>
  useStoreState((state) => {
    const loadState = state.activeProject.linkedContentLoadingState;

    return (
      (loadState.kind === "succeeded" &&
        loadState.linkedContent.kind === "jr-tutorial") ||
      (loadState.kind === "pending" &&
        loadState.linkedContentRef.kind === "jr-tutorial")
    );
  });

export const useLinkedJrTutorial = (): LinkedJrTutorial =>
  useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;

    if (contentState.kind !== "succeeded")
      throw new Error("linked lesson has not been loaded");

    if (contentState.linkedContent.kind !== "jr-tutorial")
      throw new Error("linked lesson is not suitable");

    return contentState.linkedContent;
  });
