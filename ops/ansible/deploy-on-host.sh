#!/usr/bin/env bash
# Runs on the production host as root. deploy.yaml sends it over SSH on stdin:
#
#   ssh deploy@<host> sudo bash -s apply <version> <archive sha256> [host] < deploy-on-host.sh
#   ... rollback <version> <since>     restore the backup the failed apply's switch made
#   ... summary                        the last deploys.log line and the newest backup
#
# The playbook is the one in the release's archive (fonoster/ansible), checked against the SHA256
# the plan read from the release's SHA256SUMS. The inventory is /etc/fonoster/inventory (root only;
# no release and no deploy touches it). apply prints the plan (--check --diff), then applies.
set -euo pipefail

INVENTORY=/etc/fonoster/inventory/production.yml
WORK=/var/lib/fonoster/deploy
VENV="$WORK/ansible"
ANSIBLE_CORE=2.21.5
REPO=fonoster/fonoster

fail() { echo "deploy-on-host: $*" >&2; exit 1; }
version_ok() { [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "not a version: $1"; }

# ansible-core in a venv of its own, at the version ops/ansible/README.md names.
ensure_ansible() {
  "$VENV/bin/ansible-playbook" --version 2>/dev/null | grep -q "core $ANSIBLE_CORE" && return 0
  command -v python3 >/dev/null || fail "python3 is missing"
  python3 -c "import ensurepip" 2>/dev/null || apt-get install -y -q python3-venv >/dev/null
  rm -rf "$VENV" && python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q "ansible-core==$ANSIBLE_CORE"
}

# The release's playbook in $WORK/<version>/fonoster/ansible, from its archive at the pinned SHA256.
release_playbook() {
  local v="$1" sha="$2" dir="$WORK/$1"
  if [ ! -f "$dir/fonoster/ansible/playbooks/site.yml" ]; then
    rm -rf "$dir" && mkdir -p "$dir"
    curl -fsSL "https://github.com/$REPO/releases/download/v$v/fonoster-$v.tar.gz" -o "$dir/fonoster.tar.gz" \
      || fail "could not download v$v"
    echo "$sha  $dir/fonoster.tar.gz" | sha256sum -c --quiet - || fail "fonoster-$v.tar.gz does not match the plan's SHA256"
    tar -xzf "$dir/fonoster.tar.gz" -C "$dir" fonoster/ansible || fail "version $v has no playbook"
    rm -f "$dir/fonoster.tar.gz"
  fi
  # The last three releases' playbooks are kept (a rollback runs the failed one's).
  find "$WORK" -mindepth 1 -maxdepth 1 -type d ! -name ansible -printf '%T@ %p\n' | sort -rn | tail -n +4 \
    | cut -d' ' -f2- | xargs -r rm -rf
}

[ -f "$INVENTORY" ] || fail "no $INVENTORY: see ops/ansible/README.md (Fonoster Cloud)"
mkdir -p "$WORK" && chmod 700 "$WORK"

case "${1:-}" in
apply)
  v="${2:-}" sha="${3:-}"
  version_ok "$v"
  [[ "$sha" =~ ^[0-9a-f]{64}$ ]] || fail "not a SHA256: $sha"
  tags=fonoster
  [ "${4:-}" != host ] || tags=host,fonoster
  ensure_ansible
  release_playbook "$v" "$sha"
  cd "$WORK/$v/fonoster/ansible"
  args=(-i "$INVENTORY" playbooks/site.yml --tags "$tags" -e "fonoster_version=$v" -e "fonoster_archive_sha256=$sha")
  echo "::group::Plan (--check --diff)"
  "$VENV/bin/ansible-playbook" "${args[@]}" --check --diff
  echo "::endgroup::"
  "$VENV/bin/ansible-playbook" "${args[@]}"
  ;;
rollback)
  v="${2:-}" since="${3:-}"
  version_ok "$v"
  [ -d "$WORK/$v/fonoster/ansible" ] || fail "no playbook of $v on this host"
  cd "$WORK/$v/fonoster/ansible"
  "$VENV/bin/ansible-playbook" -i "$INVENTORY" playbooks/rollback.yml -e "fonoster_rollback_since=$since"
  ;;
summary)
  echo "deploy: $(tail -n 1 /var/lib/fonoster/deploys.log 2>/dev/null)"
  echo "backup: $(ls -1 /var/lib/fonoster/backups 2>/dev/null | sort | tail -n 1)"
  ;;
*) fail "usage: deploy-on-host.sh apply <version> <sha256> [host] | rollback <version> <since> | summary" ;;
esac
