"""Compare the "help sidebar" strings of two i18n files.

Only keys of the form

    help-sidebar.SECTION_NAME.item.ITEM_NAME.help

(possibly with a further suffix, such as ".flat" or
".per-method.sprite") are considered.  For each such key whose value
differs between the two files, print a line-by-line diff of the value.
A key present in only one of the files is diffed against nothing.

Usage:

    python cmp_help_sidebar.py FILE-0.json FILE-1.json
    python cmp_help_sidebar.py --vs-git FILE.json

With "--vs-git", compare the version of FILE.json committed at git's
HEAD with the version in the working directory.
"""

from pathlib import Path
import argparse, difflib, json, re, subprocess, sys

re_help_key = re.compile(r"^help-sidebar\.[^.]+\.item\.[^.]+\.help(\.|$)")

def help_strings_of_text(text: str) -> dict[str, str]:
    translations = json.loads(text)
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

def text_at_git_head(path: Path) -> str:
    # The "HEAD:./NAME" form is resolved relative to the cwd, so run
    # git from the file's own directory.
    return subprocess.run(
        ["git", "show", f"HEAD:./{path.name}"],
        cwd=path.parent,
        capture_output=True,
        text=True,
        check=True,
    ).stdout

parser = argparse.ArgumentParser(
    description="Compare the help-sidebar strings of two i18n files."
)
parser.add_argument(
    "--vs-git",
    action="store_true",
    help="take one FILE; compare its git-HEAD version with working copy",
)
parser.add_argument("paths", nargs="+", type=Path, metavar="FILE")
args = parser.parse_args()

if args.vs_git:
    if len(args.paths) != 1:
        parser.error("--vs-git requires exactly one FILE")
    path = args.paths[0]
    try:
        text_0 = text_at_git_head(path)
    except subprocess.CalledProcessError as e:
        sys.exit(f"could not get HEAD version of \"{path}\":\n{e.stderr}")
    label_0 = f"HEAD:{path}"
    text_1 = path.read_text()
    label_1 = str(path)
else:
    if len(args.paths) != 2:
        parser.error("exactly two FILEs required (or use --vs-git)")
    path_0, path_1 = args.paths
    text_0, label_0 = path_0.read_text(), str(path_0)
    text_1, label_1 = path_1.read_text(), str(path_1)

strings_0 = help_strings_of_text(text_0)
strings_1 = help_strings_of_text(text_1)

for key in sorted(set(strings_0) | set(strings_1), key=str.lower):
    if strings_0.get(key) == strings_1.get(key):
        continue

    where = ""
    if key not in strings_0:
        where = f' (only in "{label_1}")'
    elif key not in strings_1:
        where = f' (only in "{label_0}")'

    print(f"=== {key}{where}")
    diff = difflib.unified_diff(
        lines_for_diff(strings_0, key),
        lines_for_diff(strings_1, key),
        fromfile=label_0,
        tofile=label_1,
    )
    sys.stdout.writelines(diff)
    print()
