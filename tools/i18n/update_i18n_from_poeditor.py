import json, sys
from pathlib import Path

monolithic_path = Path(sys.argv[1])
output_dir = Path(sys.argv[2])

def dict_from_path(path):
    with path.open("rt") as f_in:
        obj = json.load(f_in)
    if not isinstance(obj, dict):
        raise ValueError(f'expecting dict in "{path}"')
    return obj

dict_from_ns = {}
path_from_ns = {}
for path in output_dir.iterdir():
    if path.name.endswith("~"): continue
    dict_from_ns[ns := path.stem] = dict_from_path(path)
    path_from_ns[ns] = path

ref = dict_from_path(monolithic_path)
ref_keys = set(ref.keys())

repo_keys = set()
for ns, ns_strings in dict_from_ns.items():
    repo_keys.update(
        f"{ns}.{k}"
        for k in ns_strings.keys()
        if k != "$RUBBISH$"
    )

repo_only = repo_keys - ref_keys
for k in repo_only:
    print(f'WARN: {k} missing from reference file')

for fq_key, xln in ref.items():
    ns, key_within_ns = fq_key.split(".", 1)

    try:
        ns_dict = dict_from_ns[ns]
    except KeyError:
        print(f'WARN: repo file "{ns}.json" not found for {key_within_ns}')
        continue

    try:
        repo_xln = ns_dict[key_within_ns]
    except KeyError:
        print(f'WARN: {key_within_ns} not found in repo "{ns}.json" file')
        continue

    if repo_xln != xln and xln != "":
        print(f'INFO: {fq_key}: {repo_xln!r} -> {xln!r}')
        ns_dict[key_within_ns] = xln

for ns, ns_strings in dict_from_ns.items():
    with path_from_ns[ns].open("wt") as f_out:
        json.dump(ns_strings, f_out, ensure_ascii=False, indent=2)
        f_out.write("\n")
