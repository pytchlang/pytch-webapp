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
  echo '/* eslint-disable */'
  echo
  echo '/* This file is auto-generated. */'
  echo '/* See '"$(basename "$0")"' for the gory details. */'
  echo

  # Sorry, this is horrible.  The core ajv package can produce code
  # which does "export const" but ajv-cli doesn't (as far as I could
  # find) have a way of passing that option to ajv.  It was a choice
  # between the following and maintaining my own version of ajv-cli.
  npx --no-install prettier --parser=typescript \
    < "$bodyfile" \
    | sed -e 's|^module.exports = |export const validate = |' \
          -e 's|^\(module.exports.default = \)|// \1|'
) > "$outfile"

rm "$bodyfile"
