import { useStoreState } from "../../store";

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
        return mkTag(linkedContent.content.slug);
      case "flat-tutorial":
        return mkTag(linkedContent.content.slug);
      default:
        return null;
    }
  });
}
