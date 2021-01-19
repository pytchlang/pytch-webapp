#!/bin/bash

if [ -z "$DEPLOY_BASE_URL" ]; then
    echo "DEPLOY_BASE_URL must be set"
    exit 1
fi

if [ "$DEPLOY_BASE_URL" = "${DEPLOY_BASE_URL#/}" ]; then
    echo "DEPLOY_BASE_URL must start with a '/' character"
    exit 1
fi

if [ "$DEPLOY_BASE_URL" = / ]; then
    DEPLOY_BASE_URL=""
else
    if [ "$DEPLOY_BASE_URL" != "${DEPLOY_BASE_URL%/}" ]; then
        echo "DEPLOY_BASE_URL must not end with a '/' character"
        exit 1
    fi
fi

BUILD_DIR="$(realpath "$(dirname "$0")")"
REPO_ROOT="$(realpath "$BUILD_DIR"/..)"

cd "$REPO_ROOT"

LAYER_DIR=website-layer/layer-content

if [ -e node_modules -o -e $LAYER_DIR ]; then
    echo "Must be run in a clean clone"
    echo '(i.e., no "node_modules" or "'"$LAYER_DIR"'")'
    exit 1
fi

npm install

env PUBLIC_URL="$DEPLOY_BASE_URL"/app \
    REACT_APP_DEPLOY_BASE_URL="$DEPLOY_BASE_URL" \
    REACT_APP_SKULPT_BASE="$DEPLOY_BASE_URL"/skulpt \
    REACT_APP_TUTORIALS_BASE="$DEPLOY_BASE_URL"/tutorials \
    npm run build

mkdir "$LAYER_DIR"
mv build "$LAYER_DIR"/app

(
    cd "$LAYER_DIR"
    cp ../dot-htaccess app/.htaccess
    find app -type d -print0 | xargs -0 chmod 755
    find app -type f -print0 | xargs -0 chmod 644
    zip -r ../layer.zip app
)
