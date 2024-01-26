import { assert } from "chai";
import { guessedMimeType } from "../src/storage/guessed-mime-type";

describe("Guessed mime type", () => {
  const emptyHeaders = new Map<string, string>();
  const contentTypeHeaders = new Map<string, string>([
    ["content-type", "image/magic-png"],
  ]);

  function makeResponse(
    ok: boolean,
    basename: string,
    headersDescription: "with-content-type" | "no-content-type"
  ) {
    const provideCT = headersDescription === "with-content-type";
    return {
      ok,
      statusText: ok ? "OK" : "NOT-THERE",
      url: `https://example.com/${basename}`,
      headers: provideCT ? contentTypeHeaders : emptyHeaders,
    };
  }

  it("extracts from OK response", () => {
    const resp = makeResponse(true, "foo.png", "with-content-type");
    assert.equal(guessedMimeType(resp), "image/magic-png");
  });

  it("extracts from extension", () => {
    const resp = makeResponse(true, "foo.png", "no-content-type");
    assert.equal(guessedMimeType(resp), "image/png");
  });

  it("rejects non-ok response", () => {
    const resp = makeResponse(false, "foo.png", "no-content-type");
    assert.throws(() => {
      guessedMimeType(resp);
    }, /failed to fetch.*"NOT-THERE"/);
  });

  it("rejects extension-less basename", () => {
    const resp = makeResponse(true, "foo-no-extn", "no-content-type");
    assert.throws(() => {
      guessedMimeType(resp);
    }, /no content-type.*no extension/);
  });

  it("rejects unknown extension", () => {
    const resp = makeResponse(true, "foo.a1s2d3f4", "no-content-type");
    assert.throws(() => {
      guessedMimeType(resp);
    }, /no content-type.*unknown extension/);
  });
});
