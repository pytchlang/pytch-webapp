import json
import collections
import sys

types_from_extension = collections.defaultdict(list)

# Which sources to prefer over which other ones; earlier in list is
# preferred over later in the list.
source_priority = ["iana", "--NONE--", "apache", "nginx"]

with open("./mime-db.json") as f_in:
    db = json.load(f_in)
    for mime_full_type, info in db.items():
        parts = mime_full_type.split("/", 1)
        if len(parts) != 2:
            print("ignoring", mime_full_type, file=sys.stderr)
            continue
        mime_type, mime_subtype = parts
        if mime_type not in ["image", "audio"]:
            continue
        source_prio = source_priority.index(info.get("source", "--NONE--"))
        extensions = info.get("extensions", [])
        for ext in extensions:
            types_from_extension[ext].append((source_prio, mime_full_type))

data_out = []
for ext, tps in types_from_extension.items():
    best_type = sorted(tps)[0][1]
    data_out.append([ext, best_type])

data_json_str = json.dumps(json.dumps(data_out))

ts_content = f"""// This file has been automatically generated.

// To the extent that this code is derived from the "mime-db" project,
// it falls under the following copyright/licence:

// Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
// Copyright (c) 2015-2022 Douglas Christopher Wilson <doug@somethingdoug.com>
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// 'Software'), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

export const typeFromExtension = (() => {{
    const extensionsWithTypes = JSON.parse({data_json_str})
    const typeFromExtensionMap = new Map<string, string>(extensionsWithTypes);
    return (extension: string) => typeFromExtensionMap.get(extension) || false;
}})();
"""

print(ts_content)
