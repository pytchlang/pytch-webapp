#!/bin/bash -e

# Comment but easier to copy/paste:
cat >/dev/null <<EOF

Example usage:

git log --format='%H' STARTING_SHA1.. \
  | awk -e '{ printf "%04d-%s\n", FNR, $0 }' \
  | parallel --bar ./tools/typecheck-at-commit.sh {} TMP_TYPECHECK_OUTPUT_DIRECTORY

EOF

prefixed_sha1="$1"
outdir="$2"

if [ "$#" -ne 2 ]; then
    echo Usage: $0 PREFIXED_SHA1 OUTDIR
    exit 1
fi

sha1=${prefixed_sha1#*-}

clean_up() {
  test -d "$tmp_dir" && test -f "$tmp_dir/$sentinel" && rm -fr "$tmp_dir"
}

tmp_dir=$( mktemp -d -t typecheck-at-commit.XXXXXXXX )
sentinel="DELETE-ME-$(uuidgen)"
touch "$tmp_dir/$sentinel"

trap "clean_up" EXIT

repo_origin=$(pwd)

exec > "$outdir/$prefixed_sha1".out 2> "$outdir/$prefixed_sha1".err

cd "$tmp_dir"

git init -q .
git remote add origin "$repo_origin"
git fetch -q --depth 1 origin "$sha1"
git checkout -q FETCH_HEAD

ln -s "$repo_origin"/node_modules .

npx tsc --noEmit
( cd cypress; npx tsc --noEmit )
npm run -s lint
