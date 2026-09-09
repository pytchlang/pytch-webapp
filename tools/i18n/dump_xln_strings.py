import json, csv, sys
from pathlib import Path

wr = csv.writer(sys.stdout)

for fpath in map(Path, sys.argv[1:]):
    xln_namespace = fpath.stem
    f_in = fpath.open("rt")
    f_strings = json.load(f_in)
    for xln_key, xln_string in f_strings.items():
        if xln_key != "$RUBBISH$":
            record = (".".join([xln_namespace, xln_key]), xln_string)
            wr.writerow(record)
