import { PytchProgramKind } from "./pytch-program-types";
import {
  zDemoCatalogueEntry,
  zDemoCatalogue,
  type DemoKind,
  type DemoCatalogueEntry,
  type DemoCatalogue,
  type SortBy,
} from "./discoverable-demos-schema";
import { ExternalJsonSlice, externalJsonSlice } from "./external-json-data";
import { Action, action } from "easy-peasy";
import flatIcon from "../images/flat-simple.png";
import permethodIcon from "../images/per-method-simple.png";
import { RefObject } from "react";
import { assertNever, fetchParsedJsonValue, propSetterAction } from "../utils";
import { envVarOrFail } from "../env-utils";

export type DemoKindSelector = DemoKind | "all";
export type PytchProgramKindSelector = PytchProgramKind | "all";

/**
 * Keeping this icon section here for now since it is only used on the demos page,
 * however, this could probably be used on the projects and tutorials page in the
 * future. (and it might be nice to adjust
 */

export type ProgramKindIcon = {
  src: string;
  alt: string;
};

export function getProgramKindIcon(
  programKind: PytchProgramKind
): ProgramKindIcon {
  switch (programKind) {
    case "flat":
      return {
        src: flatIcon,
        alt: "flat project",
      };
    case "per-method":
      return {
        src: permethodIcon,
        alt: "per-method project",
      };
    default:
      return assertNever(programKind);
  }
}

function cmpCatalogueEntriesByLastUpdated(
  a: DemoCatalogueEntry,
  b: DemoCatalogueEntry
) {
  return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
}

function cmpCatalogueEntriesByDisplayName(
  a: DemoCatalogueEntry,
  b: DemoCatalogueEntry
) {
  return a.displayName.localeCompare(b.displayName);
}

// TODO: Search for all occurrences of "en" (including quotes) when we
// think about how to update for multiple languages.

function demoUrl(relativeUrl: string): string {
  const demosDataRoot = envVarOrFail("VITE_DEMO_CATALOGUE_BASE");
  return [demosDataRoot, relativeUrl].join("/");
}

function demoResourceUrl(
  uuid: string,
  language: string,
  relativeUrl: string
): string {
  return demoUrl(`${uuid}/${language}/${relativeUrl}`);
}

export function demoThumbnailImageUrl(demo: DemoCatalogueEntry): string {
  const relativeUrl = `content/thumbnail${demo.thumbnailImageExtension}`;
  return demoResourceUrl(demo.uuid, "en", relativeUrl);
}

export function maybeDemoThumbnailVideoUrl(
  demo: DemoCatalogueEntry
): string | null {
  if (demo.thumbnailVideoExtension == null) {
    return null;
  }

  const relativeUrl = `content/thumbnail${demo.thumbnailVideoExtension}`;
  return demoResourceUrl(demo.uuid, "en", relativeUrl);
}

export function demoProjectZipfileUrl(demoUuid: string): string {
  return demoResourceUrl(demoUuid, "en", "project.zip");
}

export function demoDescriptionUrl(demoUuid: string): string {
  return demoResourceUrl(demoUuid, "en", "content/description.md");
}

export function demoAssetUrl(demoUuid: string, assetPath: string) {
  return demoResourceUrl(demoUuid, "en", `content/assets/${assetPath}`);
}

export async function demoCatalogueEntryFromServer(
  demoUuid: string
): Promise<DemoCatalogueEntry> {
  const url = demoResourceUrl(demoUuid, "en", "metadata.json");
  const json = await fetchParsedJsonValue(url);
  return zDemoCatalogueEntry.parse(json);
}

export type IDemosSearchFilters = {
  searchTerm: string;
  demoKindSelector: DemoKindSelector;
  programKindSelector: PytchProgramKindSelector;
  setSearchTerm: Action<IDemosSearchFilters, string>;
  setDemoKindSelector: Action<IDemosSearchFilters, DemoKindSelector>;
  setProgramKindSelector: Action<IDemosSearchFilters, PytchProgramKindSelector>;
};

export type IDiscoverableDemos = {
  fetchedDemos: ExternalJsonSlice<DemoCatalogue>;
  searchFilters: IDemosSearchFilters;
  sortBy: SortBy;
  setSortBy: Action<IDiscoverableDemos, SortBy>;
  activePage: number;
  setActivePage: Action<IDiscoverableDemos, number>;
  recommendedIndex: number;
  setRecommendedIndex: Action<IDiscoverableDemos, number>;
};

export function demosIndexUrl(language: string): string {
  return demoUrl(`index/${language}/demos.json`);
}

/** Return those demos in the given `demos` which are marked as
 * recommended. */
export function recommendedDemos(demos: DemoCatalogue): DemoCatalogue {
  return demos.filter((demo) => demo.recommended);
}

export type DemosSearchCriteria = Pick<
  IDemosSearchFilters,
  "searchTerm" | "demoKindSelector" | "programKindSelector"
>;

/** Return those demos in the given `demos` which match the given
 * `criteria`, sorted according to the given `sortBy`. */
export function filteredSortedDemos(
  demos: DemoCatalogue,
  criteria: DemosSearchCriteria,
  sortBy: SortBy
): DemoCatalogue {
  let results = [...demos];

  if (criteria.searchTerm.length > 0) {
    const lcSearchTerm = criteria.searchTerm.toLowerCase();
    results = results.filter((demo) =>
      demo.displayName.toLowerCase().includes(lcSearchTerm)
    );
  }

  if (criteria.demoKindSelector !== "all") {
    results = results.filter(
      (demo) => criteria.demoKindSelector === demo.demoKind
    );
  }

  if (criteria.programKindSelector !== "all") {
    results = results.filter(
      (demo) => criteria.programKindSelector === demo.programKind
    );
  }

  switch (sortBy) {
    case "alphabet-asc":
      results.sort(cmpCatalogueEntriesByDisplayName);
      break;
    case "last-updated":
      results.sort(cmpCatalogueEntriesByLastUpdated);
      break;
    default:
      assertNever(sortBy);
  }

  return results;
}

export const discoverableDemos: IDiscoverableDemos = {
  fetchedDemos: externalJsonSlice(
    () => demosIndexUrl("en"),
    // TODO: check if deep comparison prevents endless re-render
    zDemoCatalogue.parse
  ),
  searchFilters: {
    searchTerm: "",
    demoKindSelector: "all",
    programKindSelector: "all",
    setSearchTerm: propSetterAction("searchTerm"),
    setDemoKindSelector: propSetterAction("demoKindSelector"),
    setProgramKindSelector: propSetterAction("programKindSelector"),
  },
  sortBy: "last-updated",
  setSortBy: action((state, newSortBy) => {
    state.sortBy = newSortBy;
  }),
  activePage: 1,
  setActivePage: propSetterAction("activePage"),
  recommendedIndex: 0,
  setRecommendedIndex: action((state, newIndex) => {
    state.recommendedIndex = newIndex;
  }),
};

export function resetVideo(videoRef: RefObject<HTMLVideoElement | null>) {
  if (videoRef.current) videoRef.current.currentTime = 0;
  if (videoRef.current) {
    videoRef.current.play().catch(() => {
      // Not much we can do, so just ignore the rejection.
    });
  }
}
