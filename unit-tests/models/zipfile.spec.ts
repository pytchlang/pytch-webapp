import { assert } from "chai";
import { readFile } from "fs/promises";
import { join as joinPath } from "path";

import {
  StandaloneProjectDescriptorOps,
  projectDescriptor,
} from "../../src/storage/zipfile";

describe("Zipfile content fingerprints", () => {
  it("computes fingerprint", async () => {
    // Better way to do this?
    const fixturesDir = joinPath(
      __dirname,
      "..",
      "..",
      "cypress",
      "fixtures",
      "project-zipfiles"
    );
    const zipPath = joinPath(fixturesDir, "print-things.zip");
    const zipContent = await readFile(zipPath);
    const projectDesc = await projectDescriptor("SOME ZIPFILE", zipContent);
    const gotFingerprint = await StandaloneProjectDescriptorOps.fingerprint(
      projectDesc
    );

    // In the below, everything can be expressed in ASCII so we get away
    // without the UTF-8 normalisation and encoding.

    // $ unzip -p print-things.zip code/code.json | jq -jr .text | sha256sum
    const expProgramLine =
      "program=flat/" +
      "a76fa4662a94488e06549a07af8b4966bd06d4af59e3c4d2947d6440f757258c" +
      "\n";

    const expAssetsLine =
      "assets=" +
      // $ echo -n "python-logo.png" | sha256sum
      "8c87ba2e4389ff14df72279d83cd4122b9a8609ec0f5a8004bd64ae81771f254" +
      // $ echo -n "image/png" | sha256sum
      "/96485abcb6721ebe4bf572c89357ab84ced0a346ef7ab2296a94b5509d9b01bd" +
      // $ unzip -p print-things.zip assets/files/python-logo.png | sha256sum
      "/ecfec4ebe46f392e6524d1706ec0ad8b30a43bc9464c1b2c214983f9c23f8f37" +
      // $ echo -n "ImageTransform/0e+0/0e+0/1e+0/1e+0/1e+0" | sha256sum
      "/fa7ad7ba6a92c08d550156fda2ab448e77d62428751f5ac033c3ffa1476cbd28" +
      "\n";

    const expFingerprint = expProgramLine + expAssetsLine;
    assert.equal(gotFingerprint, expFingerprint);
  });
});
