"""
One-off tool to split the help-sidebar information, stored in JSON,
into its structure (headings, lists of items under those headings) vs
the English-language text used for the Scratch and help content.

Usage, from root of pytch-webapp repo:

    mkdir -p src/data/{help-sidebar,i18n}

then (as one line):

    python tools/i18n/split_hsb_structure_vs_en.py
      public/data/help-sidebar.json
      src/data/help-sidebar/structure.json
      src/data/i18n/hsb-en.json
"""

import json, sys
from pathlib import Path
from typing import Any
import re

help_sidebar_in_path = Path(sys.argv[1])
structure_out_path = Path(sys.argv[2])
en_strings_out_path = Path(sys.argv[3])

frag_from_special_py = {
    "return": "return",
    "`value_1` + `value_2`": "add",
    "`value_1` - `value_2`": "subtract",
    "`value_1` * `value_2`": "multiply",
    "`value_1` / `value_2`": "divide",
    "`value_1` % `value_2`": "modulo",
    "`value_1` > `value_2`": "greater-than",
    "`value_1` < `value_2`": "less-than",
    "`value_1` == `value_2`": "equal",
    "`your_test_1` and `your_test_2`": "logical-and",
    "`your_test_1` or `your_test_2`": "logical-or",
    "not `your_test`": "logical-not",
    "`string_value_1` + `string_value_2`": "string-concatenate",
    "`string_value`[`index`]": "string-subscript",
    "len(`string_value`)": "string-length",
    "`letters` in `string_value`": "string-contains",
    "round(`value`)": "round",
    "`variable` = `value`": "assign",
    "`variable` += `value_increase`": "aug-assign-add",
    "`things`.append(`thing`)": "append",
    "del `things`[`index`]": "delete",
    "del `things`[:]": "delete-all",
    "`things`.insert(`index`, `thing`)": "insert",
    "`things`[`index`] = `new_thing`": "subscript-assign",
    "`things`[`index`]": "subscript",
    "`things`.index(`thing`)": "index",
    "len(`things`)": "length",
    "`thing` in `things`": "contains",
}

frag_for_pure_py_match = [
    "the_original",
    "all_clones",
    "all_instances",
    "the_only",
]


def insert_slug(dict_in: dict[str, str], slug: str) -> dict[str, str]:
    dict_out: dict[str, str] = {}
    keys = iter(dict_in.keys())
    exp_kind = next(keys)
    if exp_kind != "kind":
        raise ValueError('first key not "kind"')
    dict_out[exp_kind] = dict_in[exp_kind]
    dict_out["slug"] = slug
    for k in keys:  # iterate over rest of keys:
        dict_out[k] = dict_in[k]
    return dict_out


def slug_of_py(py: str) -> str:
    if py in frag_from_special_py:
        return frag_from_special_py[py]
    else:
        m = re.search(r"(self|@pytch|random)\.([A-Za-z_]*)", py)
        if not m:
            raise RuntimeError("can't guess for " + str(help_entry))
        return m.group(2).replace("_", "-").lower()


def help_entries(stem: str, help: Any) -> dict[str, str]:
    if isinstance(help, str):
        return {f"{stem}": help}

    entries = {f"{stem}.flat": help["flat"]}

    pm_help = help["per-method"]
    if isinstance(pm_help, str):
        entries[f"{stem}.per-method"] = pm_help
    else:
        entries[f"{stem}.per-method.sprite"] = pm_help["sprite"]
        entries[f"{stem}.per-method.stage"] = pm_help["stage"]

    return entries


def pick_maybe_keys(
    dict_in: dict[str, str], keys: list[str], slug: str | None = None
) -> dict[str, str]:
    """
    Key "kind" is always picked first, then the given `slug` (if
    present), then the rest of keys if present.
    """
    dict_out: dict[str, str] = {"kind": dict_in["kind"]}
    if slug is not None:
        dict_out["slug"] = slug
    dict_out.update({key: dict_in[key] for key in keys if key in dict_in})
    return dict_out


type HelpData = list[dict[str, Any]]

with help_sidebar_in_path.open("rt") as f_in:
    help_data: HelpData = json.load(f_in)
    section_slug = None

    help_structure: HelpData = []
    help_en_strings: dict[str, str] = {}

    for help_entry in help_data:
        en_strings_entries: dict[str, str]
        match (kind := help_entry.get("kind")):
            case "heading":
                # Track as state:
                section_slug = help_entry["sectionSlug"]
                structure_entry = pick_maybe_keys(help_entry, ["sectionSlug"])
                en_strings_entries = {f"{section_slug}.heading": help_entry["heading"]}
            case "block":
                slug = slug_of_py(help_entry["python"])
                structure_entry = pick_maybe_keys(
                    help_entry,
                    ["actorKind", "python", "scratchIsLong", "eventDescriptor"],
                    slug,
                )
                stem = f"{section_slug}.item.{slug}"
                en_strings_entries = {f"{stem}.scratch": help_entry["scratch"]}
                en_strings_entries.update(
                    help_entries(f"{stem}.help", help_entry["help"])
                )
            case "non-method-block":
                slug = help_entry["heading"].replace(" ", "-").lower()
                structure_entry = pick_maybe_keys(help_entry, ["python"], slug)
                stem = f"{section_slug}.item.{slug}"
                en_strings_entries = {
                    f"{stem}.heading": help_entry["heading"],
                    f"{stem}.scratch": help_entry["scratch"],
                }
                en_strings_entries.update(
                    help_entries(f"{stem}.help", help_entry["help"])
                )
            case "pure-python":
                slug: str | None = None
                for m in frag_for_pure_py_match:
                    if m in str(help_entry["python"]):
                        slug = m.replace("_", "-")
                if slug is None:
                    raise RuntimeError("no slug found", help_entry)
                structure_entry = pick_maybe_keys(help_entry, ["python"], slug)
                stem = f"{section_slug}.item.{slug}"
                en_strings_entries = help_entries(f"{stem}.help", help_entry["help"])
            case _:
                raise RuntimeError(f'unknown entry-kind "{kind}"')

        help_structure.append(structure_entry)
        help_en_strings.update(en_strings_entries)

with structure_out_path.open("wt") as f_out:
    json.dump(help_structure, f_out, ensure_ascii=False, indent=4)
    f_out.write("\n")

with en_strings_out_path.open("wt") as f_out:
    full_en_strings = {f"help-sidebar.{k}": v for k, v in help_en_strings.items()}
    json.dump(full_en_strings, f_out, ensure_ascii=False, indent=4)
    f_out.write("\n")
