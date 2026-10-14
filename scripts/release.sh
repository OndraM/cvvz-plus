#!/usr/bin/env bash
# Bumps the extension version, commits and tags it. Pushing the tag then runs the Release workflow.
# Versions are YEAR.MONTH.N, where N starts from 0 in each month.
set -euo pipefail

manifest=extension/manifest.json

if [[ -n $(git status --porcelain --untracked-files=no) ]]; then
    echo "The working tree has uncommitted changes." >&2
    exit 1
fi

npm test
npm run test:live
npm run lint

current=$(jq -r .version "$manifest")
today=$(date +%Y.%-m)
IFS=. read -r year month n <<< "$current"
if [[ "$year.$month" == "$today" ]]; then
    next="$today.$((n + 1))"
else
    next="$today.0"
fi

sed -i "s/\"version\": \"$current\"/\"version\": \"$next\"/" "$manifest"
git commit --quiet -m "Tag version $next" -- "$manifest"
git tag "$next"

echo "Tagged $next. Publish it with:"
echo "git push origin main --tags"
