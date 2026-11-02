import { ITrackedTutorial } from "../../model/project-core";
import { useStoreState } from "../../store";

export function useMappedTrackedTutorial<Result>(
  mapTutorial: (tutorial: ITrackedTutorial) => Result,
  eqResult?: (prev: Result, next: Result) => boolean
) {
  return useStoreState((state) => {
    const project = state.activeProject.project;
    const mTrackedTutorial = project.trackedTutorial;
    if (mTrackedTutorial == null)
      throw new Error(`project ${project.id} is not tracking a tutorial`);

    return mapTutorial(mTrackedTutorial);
  }, eqResult);
}

/** Hook to provide the filter-tag for use with the media library (if
 * this project is following a tutorial, flat or per-method), or `null`
 * if no filter should be applied because the project is not following a
 * tutorial. */
export function useMediaLibFilterTag(): string | null {
  const mkTag = (slug: string) => `_tutorial/${slug}`;
  return useStoreState((state) => {
    const linkedContentLoadingState =
      state.activeProject.linkedContentLoadingState;
    if (linkedContentLoadingState.kind !== "succeeded") return null;

    const linkedContent = linkedContentLoadingState.content;
    switch (linkedContent.kind) {
      case "jr-tutorial":
        return mkTag(linkedContent.content.name);
      case "flat-tutorial":
        return mkTag(linkedContent.content.slug);
      default:
        return null;
    }
  });
}
