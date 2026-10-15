/**
 * Generate the OpenAPI document for the discoverable-demos content/catalogue
 * API from the app's own Zod schema, so the published contract can never
 * drift from the code that consumes it.
 *
 *   - The catalogue *shapes* (`DemoCatalogueEntry` / `DemoCatalogue`, and
 *     `DemoInLangCatalogueEntry` / `DemoInLangCatalogue`) are derived at
 *     build time from `zDemoCatalogueEntry` and `zDemoInLangCatalogueEntry`
 *     via Zod 4's `toJSONSchema()` — this is the single source of truth.
 *   - The *paths*, server, parameters, responses and human-facing prose are
 *     not expressible in Zod, so they live in the hand-maintained skeleton
 *     below.  Per-field descriptions/formats/examples are overlaid onto the
 *     generated schema (annotations, not contract).
 *
 * Run with:  npm run gen:demos-openapi
 * Output:    tools/disco-demos-openapi.yaml  (generated; do not edit by hand)
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { stringify } from "yaml";
import { toJSONSchema } from "zod/mini";
import {
  zDemoCatalogueEntry,
  zDemoInLangCatalogueEntry,
} from "../src/model/discoverable-demos-schema";

type JsonObject = Record<string, unknown>;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const outputPath = resolve(repoRoot, "tools/disco-demos-openapi.yaml");

// --- Derive the catalogue-entry schemas from Zod ------------------------

// Curated annotations overlaid onto the generated schemas.  These are prose
// only — the structural facts (types, enums, `required`, `additionalProperties`,
// nullability) all come from the Zod schemas and update automatically.
const fieldAnnotations: Record<string, JsonObject> = {
  uuid: {
    description: "Stable identifier for this specific version of the demo.",
  },
  displayName: {
    description: "Human-readable name; used for display and A-to-Z sort.",
  },
  programKind: { description: "Pytch program kind (zPytchProgramKind)." },
  summaryMarkdown: {
    description:
      'Short summary.  Named "...Markdown", but note the current UI renders ' +
      "it as raw text in the cards and sidebar subheader (only chapter " +
      "headings/content are markdown-rendered).",
  },
  lastUpdated: {
    description:
      "Last-updated timestamp.  Consumed via `new Date(...)` (for descending " +
      '"Last Updated" sort) and `date-fns` `format(..., "PP")`, so must be ' +
      "a Date-parseable string (ISO 8601 date or date-time).",
    format: "date-time",
  },
  recommended: {
    description: "Whether the demo appears in the Recommended carousel.",
  },
  thumbnailImageExtension: {
    description:
      "File extension (including leading dot) of the thumbnail image, used to " +
      'build the thumbnail image URL, e.g. ".png".',
    examples: [".png", ".jpg"],
  },
  thumbnailVideoExtension: {
    description:
      "File extension (including leading dot) of the optional preview video, " +
      "or null when the demo has no preview video.",
    examples: [".mp4", null],
  },
  latestUuid: {
    description:
      "uuid of the latest version of this demo (may equal `uuid`" +
      " if this demo-major-version is the latest one;" +
      " may be `null` if this demo has been removed from the catalogue).",
  },
  language: {
    description:
      "Language of this entry's locale-specific content (`displayName`, " +
      "`summaryMarkdown`, `recommended`, and the thumbnail extensions), and " +
      "so also the {language} component of the URLs of the demo's resources.",
    examples: ["en", "ga"],
  },
};

const annotatedFieldNames = new Set<string>();

function annotatedEntrySchema(
  zodSchema: Parameters<typeof toJSONSchema>[0],
  description: string
): JsonObject {
  const schema = toJSONSchema(zodSchema) as JsonObject;
  // The per-schema `$schema` dialect marker is redundant inside an OpenAPI 3.1
  // components object; drop it for a cleaner document.
  delete schema.$schema;
  schema.description = description;

  const properties = schema.properties as Record<string, JsonObject>;
  for (const [name, extra] of Object.entries(fieldAnnotations)) {
    if (properties[name] != null) {
      Object.assign(properties[name], extra);
      annotatedFieldNames.add(name);
    }
  }
  return schema;
}

const entrySchema = annotatedEntrySchema(
  zDemoCatalogueEntry,
  "One demo's catalogue entry.  Mirrors the Zod `zDemoCatalogueEntry` " +
    "strict object: no additional properties are permitted, and every listed " +
    "property is required."
);

const inLangEntrySchema = annotatedEntrySchema(
  zDemoInLangCatalogueEntry,
  "One demo's catalogue entry in one language.  Mirrors the Zod " +
    "`zDemoInLangCatalogueEntry` strict object: a `zDemoCatalogueEntry` plus " +
    "`language`; no additional properties are permitted, and every listed " +
    "property is required."
);

// Every annotation should have been applied to a field of some schema.
for (const name of Object.keys(fieldAnnotations)) {
  if (!annotatedFieldNames.has(name)) {
    throw new Error(
      `Annotation for unknown field "${name}" — has the Zod schema changed?`
    );
  }
}

// --- Hand-maintained skeleton (paths / server / prose) ------------------

const languageParam = {
  name: "language",
  in: "path",
  required: true,
  description:
    "Content language code.  For per-demo resources, the `language` of " +
    "the chosen catalogue entry, or of the project's linked-demo ref.",
  schema: { type: "string", examples: ["en", "ga", "de"] },
};

const uuidParam = {
  name: "uuid",
  in: "path",
  required: true,
  description: "The demo's `uuid` (as carried in its catalogue entry).",
  schema: { type: "string" },
};

const notFoundResponse = {
  description:
    "Resource does not exist.  Inferred, not directly asserted by the " +
    "client; the client treats any non-OK fetch as an error fetch-state.",
};

const binaryResponseContent = {
  schema: { type: "string", format: "binary" },
};

const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Pytch Discoverable Demos — content/catalogue API",
    version: "0.1.0-inferred",
    description:
      "Static content feed serving the discoverable-demos catalogue indexes " +
      "(per-language and cross-language) and the per-demo resources " +
      "(metadata, project zipfile, description markdown, and thumbnail " +
      "image/video).  The catalogue JSON shapes in this document are " +
      "generated from the webapp's Zod schemas (`zDemoCatalogueEntry` and " +
      "`zDemoInLangCatalogueEntry` in src/model/discoverable-demos-schema.ts) by " +
      "scripts/generate-demos-openapi.ts; that schema is the source of truth.  " +
      'Per-demo paths carry an `x-demo-versions` extension: "all" = served ' +
      'for every version directory (including superseded ones), "live" = ' +
      "served only for UUIDs listed in the catalogue index.",
  },
  servers: [
    {
      url: "{demoCatalogueBase}",
      description:
        "Value of the VITE_DEMO_CATALOGUE_BASE environment variable.",
      variables: {
        demoCatalogueBase: {
          default: "http://localhost:8124",
          description:
            "Root of the demo catalogue server.  Set per-environment via " +
            "VITE_DEMO_CATALOGUE_BASE; the value shown is a placeholder.",
        },
      },
    },
  ],
  paths: {
    "/index/{language}/demos.json": {
      get: {
        operationId: "getDemoCatalogue",
        summary: "Fetch the demo catalogue index.",
        description:
          "Not fetched by the webapp, which uses `/index/all-demos.json` " +
          "instead.  The shape is `zDemoCatalogue` (an array of catalogue " +
          "entries).",
        parameters: [languageParam],
        responses: {
          "200": {
            description: "The full catalogue as a JSON array of demo entries.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DemoCatalogue" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/index/all-demos.json": {
      get: {
        operationId: "getAllDemosCatalogue",
        summary: "Fetch the cross-language demo catalogue index.",
        description:
          "One element per (demo, language) pair, for every live demo in " +
          "every language it is available in.  Each element, less its " +
          "`language`, equals the corresponding element of " +
          "`/index/{language}/demos.json`.  Lets the client show every demo, " +
          "each in the most suitable language available.  Source: " +
          "`allDemosIndexUrl()`, consumed by the demos list page via the " +
          "`discoverableDemos.fetchedDemos` external-JSON slice.  Parsed with " +
          "`zDemoInLangCatalogue`; `demosForLanguage()` then chooses one " +
          "entry per demo according to the UI language.",
        responses: {
          "200": {
            description:
              "The cross-language catalogue as a JSON array of entries.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DemoInLangCatalogue" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/{uuid}/{language}/metadata.json": {
      "x-demo-versions": "all",
      get: {
        operationId: "getDemoMetadata",
        summary: "Fetch a single demo's catalogue entry.",
        description:
          "Source: `demoCatalogueEntryFromServer(uuid, language)`.  Parsed " +
          "with `zDemoCatalogueEntry`; returns the same entry shape as one " +
          "element of the catalogue index.",
        parameters: [uuidParam, languageParam],
        responses: {
          "200": {
            description: "The demo's catalogue entry.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DemoCatalogueEntry" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/{uuid}/{language}/project.zip": {
      "x-demo-versions": "live",
      get: {
        operationId: "getDemoProjectZip",
        summary: "Fetch the demo's project as a zipfile.",
        description:
          "Source: `demoProjectZipfileUrl(uuid, language)`, fetched as an " +
          "ArrayBuffer by `createProjectFromDemoFlow` and decoded by " +
          "`projectDescriptor`.  Seeds a new project linked to the demo " +
          "in that language.",
        parameters: [uuidParam, languageParam],
        responses: {
          "200": {
            description: "The project zipfile (binary).",
            content: { "application/zip": binaryResponseContent },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/{uuid}/{language}/content/description.md": {
      "x-demo-versions": "all",
      get: {
        operationId: "getDemoDescription",
        summary: "Fetch the demo's chapterised description markdown.",
        description:
          "Source: `demoDescriptionUrl(uuid, language)`, fetched as text and " +
          "parsed into chapters by src/model/demo-sidebar.ts.  Convention: " +
          "each chapter begins with a top-level `# ` heading line; a " +
          'single-heading document yields a single-chapter ("mono") demo.',
        parameters: [uuidParam, languageParam],
        responses: {
          "200": {
            description: "Markdown source for the demo description/chapters.",
            content: { "text/markdown": { schema: { type: "string" } } },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/{uuid}/{language}/content/{thumbnailFilename}": {
      "x-demo-versions": "live",
      get: {
        operationId: "getDemoThumbnail",
        summary: "Fetch the demo's thumbnail image or preview video.",
        description:
          "Source: `demoThumbnailImageUrl(demo)` and " +
          "`maybeDemoThumbnailVideoUrl(demo)`.  The filename is the literal " +
          "stem `thumbnail` followed by the extension from the catalogue " +
          "entry (`thumbnailImageExtension`, or `thumbnailVideoExtension` for " +
          "the preview video); the leading dot is part of the stored value.",
        parameters: [
          uuidParam,
          languageParam,
          {
            name: "thumbnailFilename",
            in: "path",
            required: true,
            description:
              "`thumbnail` + the extension from the catalogue entry, e.g. " +
              "`thumbnail.png` or `thumbnail.mp4`.",
            schema: {
              type: "string",
              pattern: "^thumbnail\\.[A-Za-z0-9]+$",
              examples: ["thumbnail.png", "thumbnail.mp4"],
            },
          },
        ],
        responses: {
          "200": {
            description: "The thumbnail image or preview video (binary).",
            content: {
              "image/*": binaryResponseContent,
              "video/*": binaryResponseContent,
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    parameters: {},
    responses: { NotFound: notFoundResponse },
    schemas: {
      DemoCatalogue: {
        type: "array",
        description: "The catalogue index — every published demo entry.",
        items: { $ref: "#/components/schemas/DemoCatalogueEntry" },
      },
      DemoCatalogueEntry: entrySchema,
      DemoInLangCatalogue: {
        type: "array",
        description:
          "The cross-language catalogue index — every published demo entry, " +
          "in every language it is available in.",
        items: { $ref: "#/components/schemas/DemoInLangCatalogueEntry" },
      },
      DemoInLangCatalogueEntry: inLangEntrySchema,
    },
  },
};

// --- Serialise -----------------------------------------------------------

const banner = [
  "# GENERATED FILE — DO NOT EDIT BY HAND.",
  "#",
  "# The `components.schemas` shapes are generated from the webapp's Zod",
  "# schema (src/model/discoverable-demos-schema.ts); paths and prose come",
  "# from scripts/generate-demos-openapi.ts.  Regenerate with:",
  "#",
  "#     npm run gen:demos-openapi",
  "#",
  "# A CI check can run that command and `git diff --exit-code` this file to",
  "# catch drift between the served contract and the code.",
  "",
  "",
].join("\n");

// lineWidth: 0 disables line-wrapping, keeping long descriptions on single
// lines for stable, reviewable diffs.  aliasDuplicateObjects: false inlines
// the reused parameter/response objects rather than emitting YAML anchors
// (`&a1`/`*a1`), which some OpenAPI tooling does not handle.
const yamlBody = stringify(openapi, {
  lineWidth: 0,
  aliasDuplicateObjects: false,
});

writeFileSync(outputPath, banner + yamlBody, "utf8");

console.log(`Wrote ${outputPath}`);
