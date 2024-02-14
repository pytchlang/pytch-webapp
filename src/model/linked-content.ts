import { assertNever, fetchArrayBuffer } from "../utils";
import {
  projectDescriptor as projectDescriptorFromData,
  StandaloneProjectDescriptor,
  StandaloneProjectDescriptorOps,
} from "../storage/zipfile";
import { envVarOrFail } from "../env-utils";
import { LinkedJrTutorial, LinkedJrTutorialRef } from "./junior/jr-tutorial";
import { State } from "easy-peasy";
import { IPytchAppModel } from ".";
import { useStoreState } from "../store";
import { ProjectId } from "./project-core";

export type SpecimenContentHash = string;

export type LinkedContentRef =
  | { kind: "none" }
  | LinkedJrTutorialRef
  | { kind: "specimen"; specimenContentHash: SpecimenContentHash };

export const LinkedContentRefNone: LinkedContentRef = { kind: "none" };

export type LinkedContentRefUpdate = {
  projectId: ProjectId;
  contentRef: LinkedContentRef;
};

export type LessonDescriptor = {
  specimenContentHash: SpecimenContentHash;
  project: StandaloneProjectDescriptor;
};

export type LinkedContent =
  | { kind: "none" }
  | LinkedJrTutorial
  | { kind: "specimen"; lesson: LessonDescriptor };

export type LinkedContentKind = LinkedContent["kind"];

export type LinkedContentOfKind<KindT extends LinkedContent["kind"]> =
  LinkedContent & { kind: KindT };

export function eqLinkedContentRefs(
  ref1: LinkedContentRef,
  ref2: LinkedContentRef
): boolean {
  // Might have been cleaner to reject ref1.kind !== ref2.kind up front,
  // but TypeScript doesn't seem to propagate type constrints inferred
  // on ref1 to ref2.

  switch (ref1.kind) {
    case "none":
      return ref2.kind === "none";
    case "jr-tutorial":
      return ref2.kind === "jr-tutorial" && ref1.name === ref2.name;
    case "specimen":
      return (
        ref2.kind === "specimen" &&
        ref1.specimenContentHash === ref2.specimenContentHash
      );
    default:
      return assertNever(ref1);
  }
}

export function linkedContentIsReferent(
  ref: LinkedContentRef,
  content: LinkedContent
): boolean {
  switch (ref.kind) {
    case "none":
      return content.kind === "none";
    case "jr-tutorial":
      return (
        content.kind === "jr-tutorial" && content.content.name === ref.name
      );
    case "specimen":
      return (
        content.kind === "specimen" &&
        content.lesson.specimenContentHash === ref.specimenContentHash
      );
    default:
      return assertNever(ref);
  }
}

const specimenUrl = (relativeUrl: string) => {
  const baseUrl = envVarOrFail("VITE_LESSON_SPECIMENS_BASE");
  return [baseUrl, relativeUrl].join("/");
};

export async function lessonDescriptorFromRelativePath(
  relativePath: string
): Promise<LessonDescriptor> {
  const url = specimenUrl(`${relativePath}.zip`);

  const zipData = await fetchArrayBuffer(url);
  const project = await projectDescriptorFromData(undefined, zipData);

  // TODO: The hash could be precomputed and served with the zip?  A
  // field of a "metadata" JSON file?
  const specimenContentHash = await StandaloneProjectDescriptorOps.contentHash(
    project
  );

  return { specimenContentHash, project };
}

type LinkedContentLoadingStateSummary =
  | { kind: "idle" | "failed" }
  | { kind: "pending" | "succeeded"; contentKind: LinkedContentKind };

function mapLCLSS(
  state: State<IPytchAppModel>
): LinkedContentLoadingStateSummary {
  const contentState = state.activeProject.linkedContentLoadingState;
  switch (contentState.kind) {
    case "idle":
    case "failed":
      return { kind: contentState.kind };
    case "succeeded":
      return {
        kind: "succeeded",
        contentKind: contentState.content.kind,
      };
    case "pending":
      return {
        kind: "pending",
        contentKind: contentState.contentRef.kind,
      };
    default:
      return assertNever(contentState);
  }
}

function eqLCLSS(
  x: LinkedContentLoadingStateSummary,
  y: LinkedContentLoadingStateSummary
): boolean {
  switch (x.kind) {
    case "idle":
    case "failed":
      return y.kind === x.kind;
    case "pending":
    case "succeeded":
      return y.kind === x.kind && y.contentKind === x.contentKind;
    default:
      return assertNever(x);
  }
}

/** Return a summary of the linked-content loading state, containing
 * just:
 *
 * * `kind` — the progress of the loading process (idle / pending /
 *   succeeded / failed)
 * * `contentKind` — if pending or succeeded, what kind of linked
 *   content is being loaded (or has been loaded).
 *
 * Using this hook (in situations where it provides all the information
 * that is needed) rather than using `getStoreState()` to get the full
 * `LinkedContentLoadingState` avoids re-renders when irrelevant parts
 * of the loading-state change (e.g., the `interactionState` for
 * script-by-script lessons).
 * */
export function useLinkedContentLoadingStateSummary() {
  return useStoreState(mapLCLSS, eqLCLSS);
}
