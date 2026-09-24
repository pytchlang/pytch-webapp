#!/bin/bash -e

# This is likely to be specific to how I (BN) develop git histories.
# I work with one flat history of commits, but marked up to indicate
# sections.  Commits whose subject starts with "<s>" are the first
# commit of a section.  Commits whose subject starts with </s> end
# that section with a merge commit.  In the "linear" history, those
# "</s>" commits are empty, i.e., make no changes to the tree.  Often
# the within-section commits break the build, e.g., they make some
# change but do not tidy up now-unused imports.  But the idea is that
# the merge commits should always typecheck and lint cleanly.  This
# script runs the `typecheck-at-commit.sh` script on each merge-marked
# commit.
#
# See
#
#   https://github.com/bennorth/git-dendrify
#
# for more detail on this idea of linear vs structured histories.

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
