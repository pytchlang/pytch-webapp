from collections import defaultdict
import json, sys
from pathlib import Path
from typing import Any

DEMUXED_NS_DIR = Path("public/locales")
I18N_SRC_DIR = Path("src/data/i18n")
HSB_STRUCTURE_FILE = Path("src/data/help-sidebar/structure.json")
HSB_COMPILED_JSON_DIR = Path("public/data/help-sidebar")
HSB_KEY_STEM = "help-sidebar"

type StrLut = dict[str, str]


########################################################################


def write_nicely(obj: Any, path_out: Path, indent: int) -> None:
    with path_out.open("wt") as f_out:
        json.dump(obj, f_out, ensure_ascii=False, indent=indent)
        f_out.write("\n")


def pick_maybe_keys(dict_in: StrLut, keys: list[str]) -> StrLut:
    return {key: dict_in[key] for key in keys if key in dict_in}


def assign_help(help_entry: dict[str, Any], section_slug: str, slug: str) -> None:
    key_stem = f"{section_slug}.item.{slug}.help"
    xlns = {k: v for k, v in hsb_xlns.items() if k.startswith(key_stem)}

    def xln(suffix: str) -> str:
        return xlns[f"{key_stem}{suffix}"]

    # It's convenient that the number of matching entries perfectly
    # determines which of the various type disjuncts we have.
    match (n_xlns := len(xlns)):
        case 1:
            help_entry["help"] = xln("")
        case 2:
            help_entry["help"] = {
                "flat": xln(".flat"),
                "per-method": xln(".per-method"),
            }
        case 3:
            help_entry["help"] = {
                "flat": xln(".flat"),
                "per-method": {
                    "sprite": xln(".per-method.sprite"),
                    "stage": xln(".per-method.stage"),
                },
            }
        case _:
            raise ValueError(f"bad number {n_xlns} of keys matching {key_stem}")


########################################################################


def poe_xlns_from_lang(lang_code: str) -> StrLut:
    poe_file = I18N_SRC_DIR / f"{lang_code}.json"
    with poe_file.open("rt") as f_in:
        xlns: StrLut = json.load(f_in)
        print(f'INFO: read "{poe_file}"')
        return xlns


def burst_poe_into_ns(monolithic_data: StrLut) -> dict[str, StrLut]:
    i18n_data_from_ns: dict[str, StrLut] = defaultdict(dict)

    for fq_key, xln in monolithic_data.items():
        ns, key_within_ns = fq_key.split(".", 1)
        i18n_data_from_ns[ns][key_within_ns] = xln

    return i18n_data_from_ns


########################################################################


lang_code = sys.argv[1]

poe_data = poe_xlns_from_lang(lang_code)

i18n_data_from_ns: dict[str, StrLut] = defaultdict(dict)

for fq_key, xln in poe_data.items():
    ns, key_within_ns = fq_key.split(".", 1)
    i18n_data_from_ns[ns][key_within_ns] = xln

for ns, ns_xlns in i18n_data_from_ns.items():
    if ns == HSB_KEY_STEM:
        # Handle this special case afterwards
        continue
    ns_path = DEMUXED_NS_DIR / lang_code / f"{ns}.json"
    ns_xlns["$RUBBISH$"] = ""
    write_nicely(ns_xlns, ns_path, 2)
    print(f'INFO: wrote "{ns_path}"')

hsb_xlns = i18n_data_from_ns[HSB_KEY_STEM]

with HSB_STRUCTURE_FILE.open("rt") as f_in:
    hsb_structure: list[dict[str, Any]] = json.load(f_in)

print(f'INFO: read "{HSB_STRUCTURE_FILE}"')

compiled_hsb_data: list[dict[str, Any]] = []
section_slug: str = "SHOULD-NOT-SEE-THIS"
for hsb_entry in hsb_structure:
    datum: StrLut
    match (kind := hsb_entry["kind"]):
        case "heading":
            section_slug = hsb_entry["sectionSlug"]
            datum = pick_maybe_keys(hsb_entry, ["kind", "sectionSlug"])
            datum["heading"] = hsb_xlns[f"{section_slug}.heading"]
        case "block":
            slug = hsb_entry["slug"]
            datum = pick_maybe_keys(hsb_entry, ["kind", "actorKind", "python"])
            datum.update(pick_maybe_keys(hsb_entry, ["eventDescriptor"]))
            datum["scratch"] = hsb_xlns[f"{section_slug}.item.{slug}.scratch"]
            datum.update(pick_maybe_keys(hsb_entry, ["scratchIsLong"]))
            assign_help(datum, section_slug, slug)
        case "non-method-block":
            slug = hsb_entry["slug"]
            datum = pick_maybe_keys(hsb_entry, ["kind"])
            datum["heading"] = hsb_xlns[f"{section_slug}.item.{slug}.heading"]
            datum["scratch"] = hsb_xlns[f"{section_slug}.item.{slug}.scratch"]
            datum.update(pick_maybe_keys(hsb_entry, ["python"]))
            assign_help(datum, section_slug, slug)
        case "pure-python":
            slug = hsb_entry["slug"]
            datum = pick_maybe_keys(hsb_entry, ["kind", "python"])
            assign_help(datum, section_slug, slug)
        case _:
            raise RuntimeError(f'unknown entry-kind "{kind}"')
    compiled_hsb_data.append(datum)

hsb_out_path = HSB_COMPILED_JSON_DIR / f"{lang_code}.json"
write_nicely(compiled_hsb_data, hsb_out_path, 4)
print(f'INFO: wrote "{hsb_out_path}"')
