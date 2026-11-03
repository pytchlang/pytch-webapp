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
  return useMappedLinkedContentOfKind("jr-tutorial", mapContent, eqResult);
}

export const useLinkedJrTutorial = (): LinkedJrTutorial =>
  useMappedLinkedJrTutorial((tutorial) => tutorial);

export function useMappedLinkedFlatTutorial<Result>(
  mapContent: (tutorial: LinkedFlatTutorial) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useMappedLinkedContentOfKind("flat-tutorial", mapContent, eqResult);
}

export const useLinkedFlatTutorial = (): LinkedFlatTutorial =>
  useMappedLinkedFlatTutorial((tutorial) => tutorial);

export function useMappedLinkedSpecimen<Result>(
  mapContent: (specimen: LinkedSpecimen) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useMappedLinkedContentOfKind("specimen", mapContent, eqResult);
}

export const useLinkedSpecimen = (): LinkedSpecimen =>
  useMappedLinkedSpecimen((specimen) => specimen);

export function useMappedLinkedDemo<Result>(
  mapContent: (demo: LinkedDemo) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useMappedLinkedContentOfKind("demo", mapContent, eqResult);
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
