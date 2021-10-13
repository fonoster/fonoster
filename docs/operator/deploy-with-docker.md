# Deploy with Docker

The easiest way to start running your Fonos server is with our docker-in-docker (dind) installer. Before running the installation command, make sure you have [Docker Engine](https://docs.docker.com/engine/install/) installed on your machine:

## Unix

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonos/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonos:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonos:0.1.27
```

## Windows

**CMD**

```cmd
docker run -it --rm ^
  -e CONFIG_PATH="%cd%"/fonos/config ^
  --volume //var/run/docker.sock:/var/run/docker.sock ^
  --volume "%cd%"/fonos:/out:rw ^
  --entrypoint="/install.sh" ^
  fonoster/fonos:0.1.27
```

**PowerShell**

```powershell
docker run -it --rm ,
  -e CONFIG_PATH=${pwd}/fonos/config ,
  --volume /var/run/docker.sock:/var/run/docker.sock ,
  --volume ${pwd}/fonos:/out:rw ,
  --entrypoint="/install.sh" ,
  fonoster/fonos:0.1.27
```

## Environment Variables

- `DOCKER_HOST_IP` - If you run on a cloud, such as Digital Ocean, the installer will use your public IP. For a local environment, you must set the value of your host's IP (it won't be automatic.)
- `DOMAIN` - The Domain for your API endpoint
- `ENABLE_TLS` - Set to `true` if you want to generate and use a set of Let's Encrypt certificates. The value of `DOMAIN` must be publically routable. Defaults to `false`
- `HTTP_PORT` - Unsecure port for HTTP connections. Defaults to `50051`
- `HTTPS_PORT` - Secure port for HTTP connections. Defaults to `443`
- `LETSENCRYPT_EMAIL` - We recommend setting this value to get important communication from Let's Encrypt. Defaults to `admin@$DOMAIN`
- `GLOBAL_SIP_DOMAIN` - The main SIP Domain. New Domains will be under this one
