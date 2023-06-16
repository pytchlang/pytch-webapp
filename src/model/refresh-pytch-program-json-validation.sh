#!/bin/bash

set -e

outfile=pytch-program-json-validation.js

if ! [ -f "$outfile" ]; then
  >&2 echo "This script must be run from same directory as $outfile"
  >&2 echo "(If you have are in the correct directory but have deleted"
  >&2 echo "that file, use \"touch $outfile\" to create it, then re-run"
  >&2 echo "this script.)"
  exit 1
fi

bodyfile=$(mktemp)

npx --no-install ajv compile \
  -s pytch-program-schema.json \
  -o "$bodyfile"

(
  echo '// eslint-disable-next-line'
  cat "$bodyfile"
  echo
) > "$outfile"

rm "$bodyfile"
