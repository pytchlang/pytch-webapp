"""Export monolithic translation files from POEditor into the repo.

For each requested language code (default: every language which has a
file in src/data/i18n), use the POEditor API to export the project's
strings for that language in "i18next" format, ordered by term A-Z,
with no fallback language (so untranslated terms are blank).  Write
the result to src/data/i18n/LANG-CODE.json, adding a trailing newline.

(The "i18next" format gives plurals as flat "KEY_one", "KEY_other",
etc., entries, which is what we want.  The "key_value_json" format
instead gives plurals as nested objects.)

Refuses to do anything if any target file has uncommitted changes
(staged, unstaged, or untracked) according to git.

Requires settings:

    POEDITOR_API_TOKEN  -- from POEditor "Account settings" -> "API access"
    POEDITOR_PROJECT_ID -- numeric project ID (also shown on that page)

These are read from the file src/data/i18n/.env (if it exists), as
lines of the form NAME=VALUE; blank lines and lines starting "#" are
ignored, and VALUE may be surrounded by matching quotes.  A non-empty
setting in the real environment takes precedence over the file.

Run from the root of the repo, e.g.:

    python tools/i18n/fetch_from_poeditor.py          # all languages
    python tools/i18n/fetch_from_poeditor.py de ga    # just these

Afterwards, run demux_poeditor_file.py for each changed language.
"""

import argparse, json, os, subprocess, sys
import urllib.parse, urllib.request
from pathlib import Path
from typing import Any

I18N_SRC_DIR = Path("src/data/i18n")
DOTENV_PATH = I18N_SRC_DIR / ".env"
API_BASE_URL = "https://api.poeditor.com/v2"
EXPORT_TYPE = "i18next"


########################################################################


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def read_dotenv(path: Path) -> dict[str, str]:
    settings: dict[str, str] = {}
    if not path.is_file():
        return settings
    for line_no, line in enumerate(path.read_text().splitlines(), start=1):
        line = line.strip()
        if line == "" or line.startswith("#"):
            continue
        name, sep, value = line.partition("=")
        name = name.strip()
        if sep == "" or name == "":
            die(f'"{path}" line {line_no}: expecting NAME=VALUE')
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        settings[name] = value
    return settings


def require_setting(dotenv: dict[str, str], name: str) -> str:
    value = os.environ.get(name, "").strip() or dotenv.get(name, "")
    if value == "":
        die(f'{name} not set in environment or in "{DOTENV_PATH}"')
    return value


def git_dirty_status(path: Path) -> str:
    """Return git's porcelain status for PATH; empty string iff clean."""
    result = subprocess.run(
        ["git", "status", "--porcelain", "--", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def api_post(endpoint: str, params: dict[str, str]) -> dict[str, Any]:
    data = urllib.parse.urlencode(params).encode("utf-8")
    url = f"{API_BASE_URL}/{endpoint}"
    with urllib.request.urlopen(url, data=data, timeout=60) as resp:
        body = json.load(resp)
    response = body.get("response", {})
    if response.get("status") != "success":
        die(
            f'POEditor API "{endpoint}" failed:'
            f' {response.get("code")} {response.get("message")}'
        )
    return body.get("result", {})


def export_language(token: str, project_id: str, lang_code: str) -> bytes:
    result = api_post(
        "projects/export",
        {
            "api_token": token,
            "id": project_id,
            "language": lang_code,
            "type": EXPORT_TYPE,
            "order": "terms",
        },
    )
    # The returned URL is valid for a limited time (10 minutes).
    with urllib.request.urlopen(result["url"], timeout=60) as resp:
        return resp.read()


def validated_content(raw: bytes, lang_code: str) -> bytes:
    try:
        obj = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        die(f'export for "{lang_code}" is not valid JSON: {e}')
    if not isinstance(obj, dict) or len(obj) == 0:
        die(f'export for "{lang_code}" is not a non-empty JSON object')
    non_str_keys = [k for k, v in obj.items() if not isinstance(v, str)]
    if non_str_keys:
        die(
            f'export for "{lang_code}" has non-string values'
            f" for {len(non_str_keys)} key/s, e.g., {non_str_keys[0]}"
        )
    return raw if raw.endswith(b"\n") else raw + b"\n"


def write_atomically(path: Path, content: bytes) -> None:
    tmp_path = path.with_name(f".{path.name}.tmp")
    tmp_path.write_bytes(content)
    tmp_path.replace(path)


########################################################################


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export translation files from POEditor into the repo."
    )
    parser.add_argument(
        "lang_codes",
        nargs="*",
        metavar="LANG",
        help="language codes (default: all with files in src/data/i18n)",
    )
    args = parser.parse_args()

    if not I18N_SRC_DIR.is_dir():
        die(f'"{I18N_SRC_DIR}" not found; run from root of repo')

    lang_codes: list[str] = args.lang_codes or sorted(
        p.stem for p in I18N_SRC_DIR.glob("*.json")
    )

    # Check everything before fetching anything, so we don't end up
    # with a partial update.
    target_paths = {lc: I18N_SRC_DIR / f"{lc}.json" for lc in lang_codes}
    dirty = {
        path: status
        for path in target_paths.values()
        if (status := git_dirty_status(path)) != ""
    }
    if dirty:
        for path, status in dirty.items():
            print(f'ERROR: "{path}" is dirty: {status}', file=sys.stderr)
        die("refusing to overwrite; commit or stash changes first")

    dotenv = read_dotenv(DOTENV_PATH)
    token = require_setting(dotenv, "POEDITOR_API_TOKEN")
    project_id = require_setting(dotenv, "POEDITOR_PROJECT_ID")

    contents: dict[str, bytes] = {}
    for lang_code in lang_codes:
        raw = export_language(token, project_id, lang_code)
        contents[lang_code] = validated_content(raw, lang_code)
        print(f'INFO: exported "{lang_code}" from POEditor')

    for lang_code, content in contents.items():
        path = target_paths[lang_code]
        write_atomically(path, content)
        print(f'INFO: wrote "{path}"')

    print("INFO: changed files:")
    subprocess.run(["git", "status", "--short", "--", str(I18N_SRC_DIR)])


if __name__ == "__main__":
    main()
