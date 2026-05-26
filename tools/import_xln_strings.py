import json, csv, sys
from pathlib import Path
from itertools import islice
from collections import defaultdict


class XlnsFromNamespace:
    def __init__(self, root: Path):
        self.root = root
        self._xlns_from_ns = defaultdict(dict)

    def get(self, ns):
        return self._xlns_from_ns[ns]

    def write_files(self):
        for ns, xlns in self._xlns_from_ns.items():
            xlns_path = self.root / f"{ns}.json"
            with xlns_path.open("wt") as xlns_file:
                json.dump(xlns, xlns_file, ensure_ascii=False, indent=2)
                xlns_file.write("\n")


json_root = Path(sys.argv[1])
xln_col = int(sys.argv[2])

xlns_from_namespace = XlnsFromNamespace(json_root)

rd = csv.reader(sys.stdin)
for record in islice(rd, 1, None):
    fq_key = record[0]
    if not fq_key:
        continue

    xln = record[xln_col]

    ns, key_within_ns = fq_key.split(".", 1)
    xlns_from_namespace.get(ns)[key_within_ns] = xln

xlns_from_namespace.write_files()
