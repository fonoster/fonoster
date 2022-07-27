# Deploy with Docker

The easiest way to start a Fonoster instance is with our docker-in-docker (dind) installer. Before running the operator, make sure you have [Docker Engine](https://docs.docker.com/engine/install/) installed on your machine:

**TL;DR**

## Unix

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  fonoster/fonoster
```

## Windows

**CMD**

```cmd
docker run -it --rm ^
  -e CONFIG_PATH="%cd%"/fonoster/config ^
  --volume //var/run/docker.sock:/var/run/docker.sock ^
  --volume "%cd%"/fonoster:/out:rw ^
  fonoster/fonoster
```

**PowerShell**

```powershell
docker run -it --rm `
  -e CONFIG_PATH=${pwd}/fonoster/config `
  --volume /var/run/docker.sock:/var/run/docker.sock `
  --volume ${pwd}/fonoster:/out:rw `
  fonoster/fonoster
```

## Additional Entrypoints

The dind operator provides additional endpoints. Use `--entrypoint="/update.sh"` to update your instance, or use `--entrypoint="/stop.sh"` to stop all your services. 

## Troubleshooting

A known issue with the operator causes Minio to fail if there was a previous installation in the host. You will see an error on Minio's service indicating that there is a bad authentication. To fix the issue, you must manually update the password on Minio to match the one on your `.env` or start a fresh installation.

## Environment Variables

- `DOCKER_HOST_IP` - If you run on a cloud provider, like Digital Ocean, the installer will use your public IP. For a local environment, you must set the value of your host's IP (it won't be automatic.)
- `DOMAIN` - The Domain for your API endpoint. This is required for TLS support. The DNS entry must point to the public IP of your Docker Host
- `ENABLE_TLS` - Set to `true` if you want to generate and use a set of Let's Encrypt certificates. Your `DOMAIN` must be publicly accessible. Defaults to `false`.
- `HTTP_PORT` - Unsecure port for HTTP connections. Defaults to `51051`.
- `HTTPS_PORT` - Secure port for HTTP connections. Defaults to `51051`.
- `LETSENCRYPT_EMAIL` - We recommend setting this value to get important communication from Let's Encrypt. Defaults to `admin@$DOMAIN`.
- `GLOBAL_SIP_DOMAIN` - The main SIP Domain. New Domains will be under this one
- `EXTRA_SERVICES` - A comma-separated list of additional services to add.
- `FONOSTER_VERSION` - Use to indicate the version of Fonoster you wish to install. It must be a patch version.
- `CONFIG_PATH` - Use this environment variable to set the location of your configuration. **Required**
- `VERBOSE` - Controls the verbosity of the operator. Defaults to `false`.
