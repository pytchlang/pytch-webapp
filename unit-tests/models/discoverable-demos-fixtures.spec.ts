import { assert } from "chai";
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join as joinPath } from "path";

import {
  zDemoCatalogueEntry,
  zDemoInLangCatalogue,
} from "../../src/model/discoverable-demos-schema";
import { parseMarkdown } from "../../src/model/demo-sidebar";

// Layer B — fixture-validity check (no network).  Runs every catalogue
// fixture through the app's own Zod schema, and every description.md
// through the app's own chapter parser, so the Cypress fixtures can never
// silently drift from the shape the app expects.  See
// `disco-demos-e2e-tests.md`.

const kCatalogueRoot = joinPath(
  __dirname,
  "..",
  "..",
  "cypress",
  "fixtures",
  "demo-catalogue"
);

function readJson(...segments: Array<string>): unknown {
  return JSON.parse(readFileSync(joinPath(kCatalogueRoot, ...segments), "utf-8"));
}

/** UUID-named per-demo directories present on disk. */
function perDemoDirs(): Array<string> {
  return readdirSync(kCatalogueRoot).filter(
    (name) =>
      name !== "index" &&
      statSync(joinPath(kCatalogueRoot, name)).isDirectory()
  );
}

/** The cross-language catalogue index. */
function allDemos() {
  return zDemoInLangCatalogue.parse(readJson("index", "all-demos.json"));
}

/** Language directories present on disk within a per-demo directory. */
function perDemoLanguageDirs(uuid: string): Array<string> {
  return readdirSync(joinPath(kCatalogueRoot, uuid)).filter((name) =>
    statSync(joinPath(kCatalogueRoot, uuid, name)).isDirectory()
  );
}

describe("Discoverable-demos Cypress fixtures", () => {
  it("catalogue index parses against zDemoInLangCatalogue", () => {
    assert.isAbove(allDemos().length, 0);
  });

  it("every per-demo metadata.json parses against zDemoCatalogueEntry", () => {
    for (const uuid of perDemoDirs()) {
      const languages = perDemoLanguageDirs(uuid);
      assert.isAbove(languages.length, 0, `no language dirs for ${uuid}`);
      for (const language of languages) {
        const metadataPath = joinPath(uuid, language, "metadata.json");
        assert.isTrue(
          existsSync(joinPath(kCatalogueRoot, metadataPath)),
          `missing ${metadataPath}`
        );
        const entry = zDemoCatalogueEntry.parse(
          readJson(uuid, language, "metadata.json")
        );
        assert.equal(entry.uuid, uuid, `uuid mismatch in ${metadataPath}`);
      }
    }
  });

  it("every catalogue entry's metadata matches the index entry", () => {
    for (const indexEntry of allDemos()) {
      const { language, ...indexEntryLessLanguage } = indexEntry;
      const entry = zDemoCatalogueEntry.parse(
        readJson(indexEntry.uuid, language, "metadata.json")
      );
      assert.deepEqual(
        entry,
        indexEntryLessLanguage,
        `index/metadata mismatch for ${indexEntry.uuid}/${language}`
      );
    }
  });

  it("every catalogue entry's description.md parses into >= 1 chapter", () => {
    for (const entry of allDemos()) {
      const md = readFileSync(
        joinPath(
          kCatalogueRoot,
          entry.uuid,
          entry.language,
          "content",
          "description.md"
        ),
        "utf-8"
      );
      const parsed = parseMarkdown(md);
      assert.isNotNull(parsed, `description.md for ${entry.uuid} yielded no chapters`);
      assert.isAbove(parsed!.headings.length, 0);
      assert.equal(
        parsed!.content.length,
        parsed!.headings.length,
        `every chapter of ${entry.uuid} should have body content`
      );
    }
  });

  it("the fixtures cover the cases the E2E scenarios need", () => {
    const catalogue = allDemos().filter((d) => d.language === "en");

    // More than one page of results (kDemosPerPage = 10).
    assert.isAbove(catalogue.length, 10);

    // A known number of recommended demos.
    assert.isAbove(catalogue.filter((d) => d.recommended).length, 0);

    // A mix of demo kinds and program kinds.
    const demoKinds = new Set(catalogue.map((d) => d.demoKind));
    assert.isTrue(demoKinds.has("game") && demoKinds.has("snippet"));
    const programKinds = new Set(catalogue.map((d) => d.programKind));
    assert.isTrue(programKinds.has("flat") && programKinds.has("per-method"));

    // At least one demo with, and one without, a thumbnail video.
    assert.isAbove(
      catalogue.filter((d) => d.thumbnailVideoExtension != null).length,
      0
    );
    assert.isAbove(
      catalogue.filter((d) => d.thumbnailVideoExtension == null).length,
      0
    );

    // At least one single-chapter and one multi-chapter demo.
    const chapterCounts = catalogue.map((entry) => {
      const md = readFileSync(
        joinPath(kCatalogueRoot, entry.uuid, "en", "content", "description.md"),
        "utf-8"
      );
      return parseMarkdown(md)!.headings.length;
    });
    assert.isTrue(chapterCounts.some((n) => n === 1), "need a single-chapter demo");
    assert.isTrue(chapterCounts.some((n) => n > 1), "need a multi-chapter demo");
  });

  it("the fixtures cover the multi-language cases", () => {
    const entries = allDemos();
    const languagesFromUuid = new Map<string, Map<string, boolean>>();
    for (const entry of entries) {
      const recommendedFromLanguage =
        languagesFromUuid.get(entry.uuid) ?? new Map<string, boolean>();
      recommendedFromLanguage.set(entry.language, entry.recommended);
      languagesFromUuid.set(entry.uuid, recommendedFromLanguage);
    }
    const perDemo = Array.from(languagesFromUuid.values());

    // A demo with no "en" entry, so the UI must fall back.
    assert.isTrue(
      perDemo.some((m) => !m.has("en")),
      "need a demo not available in en"
    );

    // A demo in several languages, whose "recommended" flag differs
    // between them.
    assert.isTrue(
      perDemo.some((m) => new Set(m.values()).size > 1),
      "need a demo whose recommended flag varies by language"
    );
  });
});
