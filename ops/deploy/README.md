# Production deploys

`fonoster-deploy` upgrades a Docker Compose install of Fonoster in place. `.github/workflows/deploy.yaml`
drives it over SSH after every release: **prepare** runs on its own, **switch** waits for a reviewer
in the `production` environment, and a failed switch or smoke test rolls back. The database is never
touched; the switch time in the job summary is the point to restore a database backup to.

## One-time setup on the server

Run as root on the server (paths are the defaults; see the script's header for the settings):

```sh
curl -fsSL https://raw.githubusercontent.com/fonoster/fonoster/main/ops/deploy/fonoster-deploy \
  -o /usr/local/bin/fonoster-deploy && chmod 755 /usr/local/bin/fonoster-deploy

# Two keys: one may only prepare (runs without approval), one may switch and roll back.
ssh-keygen -t ed25519 -N "" -C deploy-prepare -f /root/deploy-prepare
ssh-keygen -t ed25519 -N "" -C deploy-production -f /root/deploy-production
{
  echo "command=\"FONOSTER_DEPLOY_ALLOW=prepare,status /usr/local/bin/fonoster-deploy\",restrict $(cat /root/deploy-prepare.pub)"
  echo "command=\"/usr/local/bin/fonoster-deploy\",restrict $(cat /root/deploy-production.pub)"
} >> /root/.ssh/authorized_keys
```

The script itself is updated the same way (the `curl` line) when it changes.

## One-time setup in GitHub

From a machine with `gh`, copying the two private keys off the server and deleting them there:

```sh
HOST=192.81.210.177
scp root@$HOST:/root/deploy-prepare root@$HOST:/root/deploy-production .
gh secret set DEPLOY_SSH_KEY --env production-prepare < deploy-prepare
gh secret set DEPLOY_SSH_KEY --env production < deploy-production
gh variable set DEPLOY_HOST --body "$HOST"
gh variable set DEPLOY_USER --body root
gh variable set DEPLOY_KNOWN_HOSTS --body "$(ssh-keyscan -t ed25519 $HOST 2>/dev/null)"
gh variable set APP_URL --body https://app.fonoster.ai
gh variable set API_HOST --body api.fonoster.ai
rm deploy-prepare deploy-production
ssh root@$HOST 'rm /root/deploy-prepare /root/deploy-production'
```

## Day to day

- A release runs prepare on its own; approve the `deploy` job in the run to switch.
- Redeploy or roll out an older version: `gh workflow run deploy.yaml -f version=0.31.1`.
- On the server: `fonoster-deploy status`, `fonoster-deploy rollback`, and `deploys.log` in
  `/var/lib/fonoster-deploy`.
