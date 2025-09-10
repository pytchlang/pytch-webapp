#!/bin/bash -e

sha1="$1"
outdir="$2"

if [ "$#" -ne 2 ]; then
    echo Usage: $0 SHA1 OUTDIR
    exit 1
fi

clean_up() {
  test -d "$tmp_dir" && test -f "$tmp_dir/$sentinel" && rm -fr "$tmp_dir"
}

tmp_dir=$( mktemp -d -t typecheck-at-commit.XXXXXXXX )
sentinel="DELETE-ME-$(uuidgen)"
touch "$tmp_dir/$sentinel"

trap "clean_up" EXIT

repo_origin=$(pwd)

exec > "$outdir/$sha1".out 2> "$outdir/$sha1".err

cd "$tmp_dir"

git init -q .
git remote add origin "$repo_origin"
git fetch -q --depth 1 origin "$sha1"
git checkout -q FETCH_HEAD

ln -s "$repo_origin"/node_modules .

npx tsc --noEmit
( cd cypress; npx tsc --noEmit )
npm run -s lint
