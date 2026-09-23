#!/bin/bash -e

if [ "$#" -ne 2 ]; then
    >&2 echo Usage: "$0" STARTING-COMMIT OUTPUT-DIRECTORY
    exit 1
fi

script_dir=$(dirname -- "$(readlink -f -- "$0")")

check_one_commit_cmd="$script_dir"/typecheck-at-commit.sh

start_commit="$1"
outdir="$2"

git log --format="%H %s" "$start_commit".. \
    | awk '{ subj = substr($0, length($1) + 2) }
           (subj ~ "^</s>") { print $1 }' \
    | awk '{ printf "%04d-%s\n", FNR, $0 }' \
    | parallel --bar "$check_one_commit_cmd" {} "$outdir"
