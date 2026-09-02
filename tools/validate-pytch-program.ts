/** Read from stdin and emit either "OK" if the input parses
 * successfully as JSON with the structure of a PytchProgram, or an
 * error if not.
 *
 * To run:
 *
 * npx tsx tools/validate-pytch-program.ts < maybe-program.json
 *
 * or
 *
 * extract-program-json-somehow | npx tsx tools/validate-pytch-program.ts
 */

import * as fs from "fs";
import { zPytchProgram } from "../src/model/pytch-program";

const input = fs.readFileSync(0, "utf-8");

let jsonData: unknown;
try {
  jsonData = JSON.parse(input);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`JSON parse error: ${message}`);
  process.exit(1);
}

const result = zPytchProgram.safeParse(jsonData);

if (result.success) {
  console.log("OK");
  process.exit(0);
} else {
  console.log(result.error);
  process.exit(1);
}
