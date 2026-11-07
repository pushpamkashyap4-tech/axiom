#!/usr/bin/env bash
# Push the Axiom workspace to GitHub.
#
#   GITHUB_TOKEN=ghp_xxx ./scripts/push-to-github.sh [owner/repo] [private|public]
#
# - Creates the repo if it doesn't exist yet (default: <your-login>/axiom, public)
# - Pushes the current branch to main
# - Strips the token back out of .git/config when done
#
# The token is only ever read from the environment; never write it to a file.

set -euo pipefail

API="https://api.github.com"
TARGET="${1:-}"
VISIBILITY="${2:-public}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: set GITHUB_TOKEN (a PAT with 'repo' scope)." >&2
  exit 1
fi

hdr=(-H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")

echo "==> Verifying token"
LOGIN="$(curl -fsS "${hdr[@]}" "${API}/user" | sed -n 's/.*"login": *"\([^"]*\)".*/\1/p' | head -1)"
if [[ -z "${LOGIN}" ]]; then
  echo "ERROR: token rejected by GitHub." >&2
  exit 1
fi
echo "    authenticated as ${LOGIN}"

[[ -z "${TARGET}" ]] && TARGET="${LOGIN}/axiom"
OWNER="${TARGET%%/*}"
REPO="${TARGET##*/}"
echo "==> Target repo: ${OWNER}/${REPO} (${VISIBILITY})"

CODE="$(curl -s -o /dev/null -w '%{http_code}' "${hdr[@]}" "${API}/repos/${OWNER}/${REPO}")"
if [[ "${CODE}" == "200" ]]; then
  echo "    repo already exists"
elif [[ "${CODE}" == "404" ]]; then
  PRIVATE=false
  [[ "${VISIBILITY}" == "private" ]] && PRIVATE=true
  echo "==> Creating repository"
  curl -fsS "${hdr[@]}" -X POST "${API}/user/repos" \
    -d "{\"name\":\"${REPO}\",\"private\":${PRIVATE},\"description\":\"Axiom — an AI study workspace that turns natural language into graphs, 3D scenes, diagrams and worked solutions for JEE, NEET and Boards.\",\"auto_init\":false}" \
    | sed -n 's/.*"html_url": *"\([^"]*\)".*/    created: \1/p'
else
  echo "ERROR: unexpected GitHub response ${CODE} for ${OWNER}/${REPO}" >&2
  exit 1
fi

REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git"
git remote remove origin 2>/dev/null || true
git remote add origin "${REMOTE_URL}"

echo "==> Pushing ${BRANCH} -> main"
git push -u origin "${BRANCH}:main"

# Keep the credential out of .git/config
git remote set-url origin "https://github.com/${OWNER}/${REPO}.git"

echo
echo "Done: https://github.com/${OWNER}/${REPO}"
echo "Revoke the token now if you don't need it: https://github.com/settings/tokens"
