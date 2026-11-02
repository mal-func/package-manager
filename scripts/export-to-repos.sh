#!/usr/bin/env bash
# Exports front-end/, back-end/, and deployment/ from this repo (the
# canonical CDIS Template) out to the three independent sibling repos —
# cdis-frontend, cdis-backend, cdis-deployment.
#
# This is one-directional and deliberate: all real work happens here,
# in the monorepo, first. The three sibling repos are never edited
# directly — they're regenerated from this one, so there is exactly
# one place any given line of code can drift from.
#
# Usage: ./scripts/export-to-repos.sh
# Requires the three sibling repos to already exist as directories
# next to this one (../cdis-frontend, ../cdis-backend, ../cdis-deployment),
# each a real git clone of the matching GitHub repo.
#
# This script only updates each sibling's working tree — it never
# commits or pushes. Review `git status`/`git diff` in each sibling
# and commit/push by hand once you're happy with the result.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SIBLINGS_ROOT="$(cd "$REPO_ROOT/.." && pwd)"

# .github/ is deliberately excluded from both: this monorepo runs one
# combined CI workflow at its own root, but each sibling repo needs its
# own independent, repo-specific workflow (its own GHCR image names,
# secrets, deploy triggers) — that file is maintained directly in each
# sibling repo, not generated here. Without this exclude, `rsync
# --delete` would wipe out each sibling's .github/workflows/ on every
# export, since the monorepo's front-end/back-end/deployment folders
# don't have one to copy from.
# CONTRIBUTING.md/SECURITY.md/CODEOWNERS are also excluded: like
# .github/, each sibling repo has its own standalone-appropriate
# version of these, authored directly in that repo, with no equivalent
# file inside this monorepo's front-end/back-end/deployment folders to
# sync from. Without this exclude, `rsync --delete` silently deletes
# them on every export, since the source side has nothing there at
# all — this happened for real once, caught only because the sibling
# repos' git status showed the deletions before they got committed.
EXCLUDES_APP=(--exclude='.git/' --exclude='.github/' --exclude='node_modules/' --exclude='coverage/' --exclude='dist/' --exclude='generated/' --exclude='.env' --exclude='/CONTRIBUTING.md' --exclude='/SECURITY.md' --exclude='/CODEOWNERS')
EXCLUDES_DEPLOY=(--exclude='.git/' --exclude='.github/' --exclude='node_modules/' --exclude='compose/.env' --exclude='compose/current-versions.env' --exclude='compose/previous-versions.env' --exclude='test-results/' --exclude='/CONTRIBUTING.md' --exclude='/SECURITY.md' --exclude='/CODEOWNERS')

sync_one() {
  local source_dir="$1" target_name="$2" ; shift 2
  local target_dir="$SIBLINGS_ROOT/$target_name"

  if [ ! -d "$target_dir/.git" ]; then
    echo "Skipping $target_name: $target_dir is not a git repository." >&2
    echo "  Clone it first: git clone https://github.com/WorkGaurav1/$target_name.git $target_dir" >&2
    return 1
  fi

  echo "==> Exporting $source_dir/ -> $target_dir/"
  rsync -a --delete "$@" "$REPO_ROOT/$source_dir/" "$target_dir/"
}

FAILED=0
sync_one "front-end" "cdis-frontend" "${EXCLUDES_APP[@]}" || FAILED=1
sync_one "back-end" "cdis-backend" "${EXCLUDES_APP[@]}" || FAILED=1
sync_one "deployment" "cdis-deployment" "${EXCLUDES_DEPLOY[@]}" || FAILED=1

echo
echo "==> Done. Review each sibling repo before committing:"
for name in cdis-frontend cdis-backend cdis-deployment; do
  dir="$SIBLINGS_ROOT/$name"
  [ -d "$dir/.git" ] || continue
  echo "--- $name ---"
  (cd "$dir" && git status --short) || true
done

exit "$FAILED"
