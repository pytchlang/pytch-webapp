import { PytchProgramKind } from "./pytch-program-types";
import {
  zDemoCatalogueEntry,
  zDemoInLangCatalogue,
  type DemoKind,
  type DemoCatalogueEntry,
  type DemoCatalogue,
  type DemoInLangCatalogue,
  type DemoInLangCatalogueEntry,
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
};

export type IDiscoverableDemos = {
  fetchedDemos: ExternalJsonSlice<DemoInLangCatalogue>;
  searchFilters: IDemosSearchFilters;
  setSearchTerm: Action<IDiscoverableDemos, string>;
  setDemoKindSelector: Action<IDiscoverableDemos, DemoKindSelector>;
  setProgramKindSelector: Action<IDiscoverableDemos, PytchProgramKindSelector>;
  sortBy: SortBy;
  setSortBy: Action<IDiscoverableDemos, SortBy>;
  activePage: number;
  setActivePage: Action<IDiscoverableDemos, number>;
  recommendedIndex: number;
  setRecommendedIndex: Action<IDiscoverableDemos, number>;
};

export function allDemosIndexUrl(): string {
  return demoUrl("index/all-demos.json");
}

/** Languages in which demos might be available, in the order in which
 * they should be preferred after the current UI language.  Any other
 * languages are preferred after these, in alphabetical order. */
export const kDemoLanguagePreferenceOrder = ["en", "ga", "de"];

/** Return a comparison function on language codes, which orders them
 * by preference given the current UI language `uiLanguage`.  The UI
 * language comes first, then those in `kDemoLanguagePreferenceOrder`,
 * in that order, then any others, alphabetically. */
export function cmpDemoLanguages(
  uiLanguage: string
): (a: string, b: string) => number {
  const nPreferred = kDemoLanguagePreferenceOrder.length;
  const rank = (language: string): number => {
    if (language === uiLanguage) return 0;
    const idx = kDemoLanguagePreferenceOrder.indexOf(language);
    return idx === -1 ? nPreferred + 1 : idx + 1;
  };

  return (a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return a < b ? -1 : a > b ? 1 : 0;
  };
}

/** Return one entry per demo from the given cross-language
 * `catalogue`, choosing, for each demo, the entry whose language is
 * most preferred given the current UI language `uiLanguage` (see
 * `cmpDemoLanguages()`).  Demos are returned in the order of their
 * first appearance in `catalogue`. */
export function demosForLanguage(
  catalogue: DemoInLangCatalogue,
  uiLanguage: string
): DemoInLangCatalogue {
  const cmpLanguages = cmpDemoLanguages(uiLanguage);
  const bestEntryFromUuid = new Map<string, DemoInLangCatalogueEntry>();

  for (const entry of catalogue) {
    const bestEntry = bestEntryFromUuid.get(entry.uuid);
    if (
      bestEntry == null ||
      cmpLanguages(entry.language, bestEntry.language) < 0
    ) {
      bestEntryFromUuid.set(entry.uuid, entry);
    }
  }

  return Array.from(bestEntryFromUuid.values());
}

/** Return those demos in the given `demos` which are marked as
 * recommended. */
export function recommendedDemos(demos: DemoCatalogue): DemoCatalogue {
  return demos.filter((demo) => demo.recommended);
}

/** Return those demos in the given `demos` which match the given
 * `criteria`, sorted according to the given `sortBy`. */
export function filteredSortedDemos(
  demos: DemoCatalogue,
  criteria: IDemosSearchFilters,
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

/** Return the given 1-based `page` clamped to the range of pages
 * needed to show `nItems` items with `itemsPerPage` per page.  If there
 * are no items, return 1. */
export function clampedPageNumber(
  page: number,
  nItems: number,
  itemsPerPage: number
): number {
  const lastPage = Math.max(1, Math.ceil(nItems / itemsPerPage));
  return Math.max(1, Math.min(page, lastPage));
}

/** Return the given 0-based `index` clamped to the range of valid
 * indexes into an array of length `nItems`.  If there are no items,
 * return 0. */
export function clampedIndex(index: number, nItems: number): number {
  return Math.max(0, Math.min(index, nItems - 1));
}

export const discoverableDemos: IDiscoverableDemos = {
  fetchedDemos: externalJsonSlice(
    allDemosIndexUrl,
    // TODO: check if deep comparison prevents endless re-render
    zDemoInLangCatalogue.parse
  ),
  searchFilters: {
    searchTerm: "",
    demoKindSelector: "all",
    programKindSelector: "all",
  },
  setSearchTerm: action((state, searchTerm) => {
    state.searchFilters.searchTerm = searchTerm;
    state.activePage = 1;
  }),
  setDemoKindSelector: action((state, demoKindSelector) => {
    state.searchFilters.demoKindSelector = demoKindSelector;
    state.activePage = 1;
  }),
  setProgramKindSelector: action((state, programKindSelector) => {
    state.searchFilters.programKindSelector = programKindSelector;
    state.activePage = 1;
  }),
  sortBy: "last-updated",
  setSortBy: action((state, newSortBy) => {
    state.sortBy = newSortBy;
    state.activePage = 1;
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
