import json, sys
from pathlib import Path
from collections import Counter

"""
In zsh you can do, e.g.,:

diff -u \
  --label en <(python tools/dump_xln_keys.py public/locales/en) \
  --label ga <(python tools/dump_xln_keys.py public/locales/ga)
"""


all_keys = []

root = Path(sys.argv[1])
for xln_path in root.rglob("*.json"):
    xln_namespace = xln_path.stem
    with xln_path.open("rt") as f_in:
        f_strings = json.load(f_in)
        all_keys.extend(
            f"{xln_namespace}.{xln_key}"
            for xln_key in f_strings.keys()
            if xln_key != "$RUBBISH$"
        )

for key, freq in Counter(all_keys).items():
    if freq > 1:
        sys.stderr.write(f"Repeated key: {key} {freq}\n")

unique_keys = sorted(set(all_keys))
for key in unique_keys:
    print(key)
