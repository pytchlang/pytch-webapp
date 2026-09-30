"""Compare the "help sidebar" strings of two i18n files.

Only keys of the form

    help-sidebar.SECTION_NAME.item.ITEM_NAME.help

(possibly with a further suffix, such as ".flat" or
".per-method.sprite") are considered.  For each such key whose value
differs between the two files, print a line-by-line diff of the value.
A key present in only one of the files is diffed against nothing.

Usage:

    python cmp_help_sidebar.py FILE-0.json FILE-1.json
"""

from pathlib import Path
import difflib, json, re, sys

re_help_key = re.compile(r"^help-sidebar\.[^.]+\.item\.[^.]+\.help(\.|$)")

def help_strings_of_path(path: Path) -> dict[str, str]:
    with path.open("rt") as f_in:
        translations = json.load(f_in)
    return {
        k: v
        for k, v in translations.items()
        if re_help_key.match(k)
    }

def lines_for_diff(strings: dict[str, str], key: str) -> list[str]:
    # Keep a trailing "\n" on every line, so that difflib does not
    # report a spurious "\ No newline at end of file"-style mismatch
    # when only the last line differs.
    value = strings.get(key)
    return [] if value is None else [f"{line}\n" for line in value.split("\n")]

path_0, path_1 = [Path(arg) for arg in sys.argv[1:3]]
strings_0 = help_strings_of_path(path_0)
strings_1 = help_strings_of_path(path_1)

for key in sorted(set(strings_0) | set(strings_1), key=str.lower):
    if strings_0.get(key) == strings_1.get(key):
        continue

    where = ""
    if key not in strings_0:
        where = f' (only in "{path_1}")'
    elif key not in strings_1:
        where = f' (only in "{path_0}")'

    print(f"=== {key}{where}")
    diff = difflib.unified_diff(
        lines_for_diff(strings_0, key),
        lines_for_diff(strings_1, key),
        fromfile=str(path_0),
        tofile=str(path_1),
    )
    sys.stdout.writelines(diff)
    print()
