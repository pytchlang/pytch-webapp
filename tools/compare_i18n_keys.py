import json, sys
from collections import defaultdict
from pathlib import Path

xlns_from_lang = defaultdict(dict)

base_path, cmp_path = sys.argv[1:3]
base_lang, cmp_lang = [Path(path).name for path in [base_path, cmp_path]]

for dir in [base_path, cmp_path]:
    lang = Path(dir).name
    for xln_path in Path(dir).rglob("*.json"):
        xln_namespace = xln_path.stem
        with xln_path.open("rt") as f_in:
            f_strings = json.load(f_in)
        for i18n_key, i18n_value in f_strings.items():
            if i18n_key == "$RUBBISH$":
                continue
            xlns_from_lang[lang][f"{xln_namespace}.{i18n_key}"] = i18n_value

base_xlns = xlns_from_lang[base_lang]
cmp_xlns = xlns_from_lang[cmp_lang]
base_keys = set(base_xlns)
cmp_keys = set(cmp_xlns)

base_only = base_keys - cmp_keys
if base_only:
    print(f'{len(base_only)} strings missing from "{cmp_lang}":')
    for k in sorted(base_only):
        print(f"  {k} {base_xlns[k]!r}")

cmp_only = cmp_keys - base_keys
if cmp_only:
    print(f"{len(cmp_only)} extra strings in {cmp_lang}:")
    for k in sorted(cmp_only):
        print(f"  {k}")
