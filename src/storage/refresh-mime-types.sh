#!/bin/bash

set -e

have_all_tools=yes
for tool in python curl; do
    if ! hash "$tool" 2> /dev/null; then
        >&2 echo Could not find "$tool"
        have_all_tools=no
    fi
done

if [ "$have_all_tools" = "no" ]; then
    >&2 echo
    >&2 echo "Required tool/s missing.  Please install it/them and try again."
    exit 1
fi

python_script=refresh_mime_types.py

if ! [ -r "$python_script" ]; then
    >&2 echo "Python file $python_script missing."
    >&2 echo "Are you in the wrong directory?"
    exit 1
fi

if [ x"$1" = x--fetch ]; then
    curl -sS \
         -o mime-db.json \
         https://raw.githubusercontent.com/jshttp/mime-db/master/db.json
fi

python "$python_script" > mime-types.ts
