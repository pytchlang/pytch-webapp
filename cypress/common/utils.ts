const allSpaces = new RegExp("^ *$");
const initialSpaces = new RegExp("^ *");

/** Return a de-indented version of the given `rawCode`, which must,
 * when separated into lines on the `\n` character,
 *
 * * begin with an empty line;
 * * have a last line consisting entirely of spaces.
 *
 * Working with the intervening lines, the longest sequence of leading
 * spaces of non-blank lines is stripped from each line, and the result
 * joined backed together with `\n` characters; a final `\n` is
 * appended.
 *
 * Example:
 *
 * ```
 *         deIndent(`
 *           x = 3
 *
 *           if x == 3:
 *               y = 4
 *         `)
 * ```
 * gives
 * ```text
 * x = 3
 *
 * if x == 3:
 *     y = 4
 * ```
 */
export const deIndent = (rawCode: string): string => {
  const allLines = rawCode.split("\n");

  if (allLines[0] !== "") {
    throw Error("need empty first line of code");
  }
  const nLines = allLines.length;
  if (!allSpaces.test(allLines[nLines - 1])) {
    throw Error("need all-spaces last line of code");
  }

  const lines = allLines.slice(1, nLines - 1);

  const nonBlankLines = lines.filter((line) => !allSpaces.test(line));
  const nonBlankIndents = nonBlankLines.map(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (line) => initialSpaces.exec(line)![0].length
  );
  const minNonBlankIndent = Math.min(...nonBlankIndents);

  const strippedLines = lines.map((line) => line.substring(minNonBlankIndent));
  return strippedLines.join("\n") + "\n";
};
