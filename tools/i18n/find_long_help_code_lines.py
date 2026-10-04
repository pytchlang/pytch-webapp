import json, re, sys

# Report help-sidebar item strings whose fenced code blocks contain any
# line longer than MAX_CODE_LINE_LENGTH characters.
#
# Usage: python find_long_help_code_lines.py PATH/TO/FILE.json

MAX_CODE_LINE_LENGTH = 47

help_key_re = re.compile(r"^help-sidebar\.[^.]+\.item\.[^.]+\.help(\..+)?$")

def code_block_lines(markdown):
    in_code = False
    for line in markdown.split("\n"):
        if line.strip().startswith("```"):
            in_code = not in_code
        elif in_code:
            yield line

def has_long_code_line(markdown):
    return any(
        len(line) > MAX_CODE_LINE_LENGTH
        for line in code_block_lines(markdown)
    )

(json_path,) = sys.argv[1:]
with open(json_path, "rt") as f_in:
    strings = json.load(f_in)

for key, value in strings.items():
    if not help_key_re.match(key) or not isinstance(value, str):
        continue
    if has_long_code_line(value):
        print(f"{key}:\n{value}\n")
