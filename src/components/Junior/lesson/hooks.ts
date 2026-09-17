import { useStoreState } from "../../../store";
import { LinkedJrTutorial } from "../../../model/junior/jr-tutorial";
import {
  LinkedContentKind,
  LinkedDemo,
  LinkedSpecimen,
} from "../../../model/linked-content";

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

/** TODO It should be possible to make this work the same way as
 * useMappedLinkedSpecimen(), i.e., throw an error if the linked content
 * is not successfully loaded and of the correct kind.  In fact then we
 * could pull out a common function, since the logic will be identical,
 * and only the kind string and content type differ. */

export function useMappedLinkedDemo<Result>(
  mapContent: (specimen: LinkedDemo) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;

    if (contentState.kind !== "succeeded")
      throw new Error("linked demo has not been loaded");

    if (contentState.content.kind !== "demo")
      throw new Error("linked content is wrong kind");

    return mapContent(contentState.content);
  }, eqResult);
}

export const useLinkedDemo = (): LinkedDemo =>
  useMappedLinkedDemo((demo) => demo);

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
