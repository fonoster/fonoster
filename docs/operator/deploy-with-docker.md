# Deploy with Docker

The easiest way to start running your Fonoster server is with our docker-in-docker (dind) installer. Before running the installation command, make sure you have [Docker Engine](https://docs.docker.com/engine/install/) installed on your machine:

## Unix

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster:0.2.20
```

## Windows

**CMD**

```cmd
docker run -it --rm ^
  -e CONFIG_PATH="%cd%"/fonoster/config ^
  --volume //var/run/docker.sock:/var/run/docker.sock ^
  --volume "%cd%"/fonoster:/out:rw ^
  --entrypoint="/install.sh" ^
  fonoster/fonoster:0.2.20
```

**PowerShell**

```powershell
docker run -it --rm `
  -e CONFIG_PATH=${pwd}/fonoster/config `
  --volume /var/run/docker.sock:/var/run/docker.sock `
  --volume ${pwd}/fonoster:/out:rw `
  --entrypoint="/install.sh" `
  fonoster/fonoster:0.2.20
```

## Environment Variables

- `DOCKER_HOST_IP` - If you run on a cloud, such as Digital Ocean, the installer will use your public IP. For a local environment, you must set the value of your host's IP (it won't be automatic.)
- `DOMAIN` - The Domain for your API endpoint. This is required for TLS support. The DNS entry must point to the public IP of your Docker Host
- `ENABLE_TLS` - Set to `true` if you want to generate and use a set of Let's Encrypt certificates. The value of `DOMAIN` must be publicly accessible. Defaults to `false`
- `HTTP_PORT` - Unsecure port for HTTP connections. Defaults to `50051`
- `HTTPS_PORT` - Secure port for HTTP connections. Defaults to `443`
- `LETSENCRYPT_EMAIL` - We recommend setting this value to get important communication from Let's Encrypt. Defaults to `admin@$DOMAIN`
- `GLOBAL_SIP_DOMAIN` - The main SIP Domain. New Domains will be under this one
