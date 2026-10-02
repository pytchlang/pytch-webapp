"""Sort, IN-PLACE, the given i18n file by lower-case keys.
"""

from pathlib import Path
import sys, json
from typing import Any

def write_nicely(obj: Any, path_out: Path, indent: int) -> None:
    with path_out.open("wt") as f_out:
        json.dump(obj, f_out, ensure_ascii=False, indent=indent)
        f_out.write("\n")

target_path = Path(sys.argv[1])

with open(target_path, "rt") as f_in:
    translations = json.load(f_in)

sorted_translations = {
    k: translations[k]
    for k in sorted(translations.keys(), key=str.lower)
}

write_nicely(sorted_translations, target_path, 2)
