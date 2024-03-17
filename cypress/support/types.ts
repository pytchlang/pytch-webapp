import { VersionTag } from "../../src/model/version-opt-in";

interface IFixtureAsset {
  name: string;
  mimeType: string;
}

export interface ResetDatabaseOptions {
  initialUrl?: string;
  uiVersion?: VersionTag;
  extraAssets?: Array<IFixtureAsset>;
  extraProjectNames?: Array<string>;
  extraWindowActions?: Array<(w: Window) => void>;
}

export type ArrayRGBA = [number, number, number, number];

export type ContentMatch = string | RegExp;

/** Almost all errors should be "user-space" errors, i.e., something the
 * user has done wrong.  There are a few places where "internal" errors
 * can crop up, i.e., "this shouldn't happen".  Distinguish between
 * these for tests. */
export type PytchErrorKind = "user-space" | "internal";
