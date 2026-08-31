#!/bin/bash
# =============================================================================
# Frontend deploy receiver — the ONLY thing the frontend CI SSH key may run
# =============================================================================
# Installed on the VPS as a forced command in root's authorized_keys. See the
# backend repo's deploy/ci/deploy-receiver.sh for the reasoning: an unrestricted
# key in a GitHub secret is a root shell for anyone who can push to the
# repository, and for any compromised third-party Action in the workflow.
#
# Receives a gzipped tar of the Vite `dist/` output on STDIN.
#
# Releases are kept as timestamped directories and switched by moving a SYMLINK,
# never by overwriting files in place. Overwriting is not atomic: for the
# seconds it takes to extract, nginx serves a document root that is half old and
# half new, so index.html can name bundles that do not exist yet and users get a
# blank page. Replacing a symlink is a single rename(2).
# =============================================================================
set -euo pipefail

ROOT=/opt/kiutkpi
RELEASES="$ROOT/frontend-releases"
LIVE="$ROOT/frontend"
KEEP=5

log() { printf '[frontend] %s\n' "$*"; }

mkdir -p "$RELEASES"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NEW="$RELEASES/$STAMP"
mkdir -p "$NEW"

log "receiving build"
# --no-same-owner: the archive is built by a GitHub runner whose uids mean
# nothing here. Extracting only into a directory we just created also means a
# malicious archive cannot place a file outside it.
tar -xzf - -C "$NEW" --no-same-owner

# A build with no index.html is not a build. Refuse rather than point the
# symlink at a directory that will 404 every route in the app.
if [ ! -f "$NEW/index.html" ]; then
    log "ERROR: bundle contains no index.html; refusing to publish"
    rm -rf "$NEW"
    exit 1
fi

chown -R www-data:www-data "$NEW"
find "$NEW" -type d -exec chmod 755 {} +
find "$NEW" -type f -exec chmod 644 {} +

PREVIOUS=""
if [ -L "$LIVE" ]; then
    PREVIOUS="$(readlink -f "$LIVE")"
elif [ -d "$LIVE" ]; then
    # First real deploy, replacing the placeholder directory made during setup.
    log "replacing the initial placeholder directory with a symlink"
    rm -rf "$LIVE"
fi

# mv -T over a symlink is the atomic step: rename(2) swaps it in one operation,
# so no request ever observes a missing or half-written document root.
ln -sfn "$NEW" "$LIVE.tmp"
mv -Tf "$LIVE.tmp" "$LIVE"
log "published $STAMP"

if ! curl -sS -o /dev/null -w '%{http_code}' --max-time 15 https://kiut-kpi.duckdns.org/ | grep -qx 200; then
    log "ERROR: the site did not return 200 after publishing"
    if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
        log "ROLLING BACK to $(basename "$PREVIOUS")"
        ln -sfn "$PREVIOUS" "$LIVE.tmp"
        mv -Tf "$LIVE.tmp" "$LIVE"
        log "rollback complete"
    fi
    exit 1
fi

# Prune old releases ONLY after the new one is confirmed serving, so a failing
# deploy can never delete the release it needs to roll back to.
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -rf
log "deploy OK"
