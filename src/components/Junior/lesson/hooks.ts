import { useStoreState } from "../../../store";
import { LinkedJrTutorial } from "../../../model/junior/jr-tutorial";
import {
  LinkedContentKind,
  LinkedSpecimen,
} from "../../../model/linked-content";

const useHasLinkedContentOfKind = (tgtKind: LinkedContentKind): boolean =>
  useStoreState((state) => {
    const loadState = state.activeProject.linkedContentLoadingState;

    return (
      (loadState.kind === "succeeded" && loadState.content.kind === tgtKind) ||
      (loadState.kind === "pending" && loadState.contentRef.kind === tgtKind)
    );
  });

export const useHasLinkedLesson = () =>
  useHasLinkedContentOfKind("jr-tutorial");

export const useHasLinkedSpecimen = () => useHasLinkedContentOfKind("specimen");

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

export const useLinkedJrTutorial = (): LinkedJrTutorial =>
  useMappedLinkedJrTutorial((tutorial) => tutorial);

export function useMappedLinkedSpecimen<Result>(
  mapContent: (specimen: LinkedSpecimen) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;

    if (contentState.kind !== "succeeded")
      throw new Error("linked content has not been loaded");

    if (contentState.content.kind !== "specimen")
      throw new Error("linked content is wrong kind");

    return mapContent(contentState.content);
  }, eqResult);
}

export const useLinkedSpecimen = (): LinkedSpecimen =>
  useMappedLinkedSpecimen((specimen) => specimen);

// Not exactly a hook, but similar in spirit.
export function focusChapterContent() {
  const contentElts = document.getElementsByClassName("Junior-LessonContent");

  const nElts = contentElts.length;
  if (nElts !== 1) {
    console.warn(`focusChapterContent(): Found ${nElts} elts`);
  }
  if (nElts > 0) {
    const targetElement = contentElts[0] as HTMLElement;
    targetElement.focus();
  }
}
