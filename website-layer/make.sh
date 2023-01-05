#!/bin/bash

cd_or_fail() { cd "$1" || exit 1; }

: "${DEPLOY_BASE_URL:?}"
: "${PYTCH_DEPLOYMENT_ID:?}"
: "${PYTCH_VERSION_TAG:?}"

if [ "$DEPLOY_BASE_URL" = "${DEPLOY_BASE_URL#/}" ]; then
    echo "DEPLOY_BASE_URL must start with a '/' character"
    exit 1
fi

if [ "$DEPLOY_BASE_URL" = / ]; then
    DEPLOY_BASE_URL=""
elif [ "$DEPLOY_BASE_URL" != "${DEPLOY_BASE_URL%/}" ]; then
    echo "DEPLOY_BASE_URL must not end with a '/' character"
    exit 1
fi

if ! hash node 2> /dev/null; then
    echo Could not find node
    exit 1
fi

node_version=$(node --version)
if [ "$(echo "$node_version" | grep -c -E '^v14[.]')" -ne 1 ]; then
    echo Need node v14 but have "$node_version"
    exit 1
fi

BUILD_DIR="$(realpath "$(dirname "$0")")"
REPO_ROOT="$(realpath "$BUILD_DIR"/..)"

cd_or_fail "$REPO_ROOT"

LAYER_DIR=website-layer/layer-content

if [ -e node_modules ] || [ -e $LAYER_DIR ]; then
    echo "Must be run in a clean clone"
    echo '(i.e., no "node_modules" or "'"$LAYER_DIR"'")'
    exit 1
fi

npm ci

# REACT_APP_DEMOS_BASE is deliberately outside DEPLOY_BASE_URL.  Our
# initial approach is to manage the collection of demos separately
# from the releases of the webapp itself.
#
env PUBLIC_URL="$DEPLOY_BASE_URL"/app \
    REACT_APP_DEPLOY_BASE_URL="$DEPLOY_BASE_URL" \
    REACT_APP_SKULPT_BASE="$DEPLOY_BASE_URL"/skulpt/"$PYTCH_DEPLOYMENT_ID" \
    REACT_APP_TUTORIALS_BASE="$DEPLOY_BASE_URL"/tutorials/"$PYTCH_DEPLOYMENT_ID" \
    REACT_APP_DEMOS_BASE=/demos \
    REACT_APP_VERSION_TAG="$PYTCH_VERSION_TAG" \
    npm run build

mkdir "$LAYER_DIR"
mv build "$LAYER_DIR"/app

(
    cd_or_fail "$LAYER_DIR"
    cp ../dot-htaccess app/.htaccess
    find app -type d -print0 | xargs -0 chmod 755
    find app -type f -print0 | xargs -0 chmod 644
    zip -r ../layer.zip app
)
