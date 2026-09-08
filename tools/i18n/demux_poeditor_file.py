from collections import defaultdict
import json, sys
from pathlib import Path
from typing import Any

DEMUXED_NS_DIR = Path("public/locales")
I18N_SRC_DIR = Path("src/data/i18n")
HSB_STRUCTURE_FILE = Path("src/data/help-sidebar/structure.json")
HSB_COMPILED_JSON_DIR = Path("public/data/help-sidebar")
HSB_KEY_STEM = "help-sidebar"
FALLBACK_LANG_CODE = "en"

type StrLut = dict[str, str]


########################################################################


def write_nicely(obj: Any, path_out: Path, indent: int) -> None:
    with path_out.open("wt") as f_out:
        json.dump(obj, f_out, ensure_ascii=False, indent=indent)
        f_out.write("\n")


def pick_maybe_keys(dict_in: StrLut, keys: list[str]) -> StrLut:
    return {key: dict_in[key] for key in keys if key in dict_in}


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
        # We don't want empty strings.  They should be missing instead,
        # to allow i18next to use the fallback language.
        if xln.strip() == "":
            continue
        ns, key_within_ns = fq_key.split(".", 1)
        i18n_data_from_ns[ns][key_within_ns] = xln

    return i18n_data_from_ns


########################################################################


lang_code = sys.argv[1]
lang_dir = DEMUXED_NS_DIR / lang_code

if not lang_dir.is_dir():
    lang_dir.mkdir()
    print(f'INFO: created "{lang_dir}"')

poe_data = poe_xlns_from_lang(lang_code)

i18n_data_from_ns = burst_poe_into_ns(poe_data)

for ns, ns_xlns in i18n_data_from_ns.items():
    if ns == HSB_KEY_STEM:
        # Handle this special case afterwards
        continue
    ns_path = lang_dir / f"{ns}.json"
    ns_xlns["$RUBBISH$"] = ""
    write_nicely(ns_xlns, ns_path, 2)
    print(f'INFO: wrote "{ns_path}"')

hsb_xlns = i18n_data_from_ns[HSB_KEY_STEM]

poe_fallback_data = poe_xlns_from_lang(FALLBACK_LANG_CODE)
i18n_fb_data_from_ns = burst_poe_into_ns(poe_fallback_data)
hsb_fb_xlns = i18n_fb_data_from_ns[HSB_KEY_STEM]


def hsb_xln(key: str) -> str:
    xln = hsb_xlns.get(key)
    if xln is None or xln == "":
        xln = hsb_fb_xlns.get(key)
    if xln is None or xln == "":
        raise KeyError(
            f'key "{key}" not found in "{lang_code}"'
            f' or fallback "{FALLBACK_LANG_CODE}"'
        )
    return xln


def assign_help(help_entry: dict[str, Any], section_slug: str, slug: str) -> None:
    key_stem = f"{section_slug}.item.{slug}.help"

    # Populate with fallback then overwrite with the main target xlns.
    xlns = {k: v for k, v in hsb_fb_xlns.items() if k.startswith(key_stem)}
    xlns.update({k: v for k, v in hsb_xlns.items() if k.startswith(key_stem)})

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
            datum["heading"] = hsb_xln(f"{section_slug}.heading")
        case "block":
            slug = hsb_entry["slug"]
            datum = pick_maybe_keys(hsb_entry, ["kind", "actorKind", "python"])
            datum.update(pick_maybe_keys(hsb_entry, ["eventDescriptor"]))
            datum["scratch"] = hsb_xln(f"{section_slug}.item.{slug}.scratch")
            datum.update(pick_maybe_keys(hsb_entry, ["scratchIsLong"]))
            assign_help(datum, section_slug, slug)
        case "non-method-block":
            slug = hsb_entry["slug"]
            datum = pick_maybe_keys(hsb_entry, ["kind"])
            datum["heading"] = hsb_xln(f"{section_slug}.item.{slug}.heading")
            datum["scratch"] = hsb_xln(f"{section_slug}.item.{slug}.scratch")
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
