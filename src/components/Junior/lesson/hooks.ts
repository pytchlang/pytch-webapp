import { useStoreState } from "../../../store";
import { assertLinkedContentSucceededOfKind } from "../../../model/project";
import { LinkedJrTutorial } from "../../../model/junior/jr-tutorial";
import { LinkedFlatTutorial } from "../../../model/flat-tutorial";
import {
  LinkedContentKind,
  LinkedContentOfKind,
  LinkedDemo,
  LinkedSpecimen,
} from "../../../model/linked-content";

/** Map the active project's linked content through the given function,
 * throwing an error if the linked content has not been successfully
 * loaded, or is not of the given kind. */
export function useMappedLinkedContentOfKind<
  KindT extends LinkedContentKind,
  Result,
>(
  kind: KindT,
  mapContent: (content: LinkedContentOfKind<KindT>) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, kind);

    return mapContent(contentState.content);
  }, eqResult);
}

export function useMappedLinkedJrTutorial<Result>(
  mapContent: (tutorial: LinkedJrTutorial) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, "jr-tutorial");

    return mapContent(contentState.content);
  }, eqResult);
}

export const useLinkedJrTutorial = (): LinkedJrTutorial =>
  useMappedLinkedJrTutorial((tutorial) => tutorial);

export function useMappedLinkedFlatTutorial<Result>(
  mapContent: (tutorial: LinkedFlatTutorial) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, "flat-tutorial");

    return mapContent(contentState.content);
  }, eqResult);
}

export const useLinkedFlatTutorial = (): LinkedFlatTutorial =>
  useMappedLinkedFlatTutorial((tutorial) => tutorial);

export function useMappedLinkedSpecimen<Result>(
  mapContent: (specimen: LinkedSpecimen) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, "specimen");

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
  mapContent: (demo: LinkedDemo) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const contentState = state.activeProject.linkedContentLoadingState;
    assertLinkedContentSucceededOfKind(contentState, "demo");

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
