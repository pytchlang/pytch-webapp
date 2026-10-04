import json, re, sys

cardinal_key_re = re.compile(r"(.*)_(two|few|many)$")

(json_path,) = sys.argv[1:]
with open(json_path, "rt") as f_in:
    strings = json.load(f_in)

replacements = {}
for key, value in strings.items():
    if (m := cardinal_key_re.match(key)) is None:
        continue
    if value != "":
        print("WARN:", key, value)
    other_key = m.group(1) + "_other"
    replacements[key] = strings[other_key]

for key, value in replacements.items():
    strings[key] = value

with open(json_path, "wt") as f_out:
    json.dump(strings, f_out, ensure_ascii=False, indent=2)
    f_out.write("\n")
