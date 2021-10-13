# Deploy with Docker

Fonos backend server is designed to run in a container environment. Running your server is as easy as running one command from your terminal. The easiest way to start running your Fonos server is by running our docker-compose file. Before running the installation command make sure you have [Docker](https://www.docker.com/products/docker-desktop) installed on your machine:

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

** CMD **

```bash
docker run -it --rm ^
  -e CONFIG_PATH="%cd%"/fonos/config ^
  --volume //var/run/docker.sock:/var/run/docker.sock ^
  --volume "%cd%"/fonos:/out:rw ^
  --entrypoint="/install.sh" ^
  fonoster/fonos:0.1.27
```

** PowerShell **

```bash
docker run -it --rm ,
  -e CONFIG_PATH=${pwd}/fonos/config ,
  --volume /var/run/docker.sock:/var/run/docker.sock ,
  --volume ${pwd}/fonos:/out:rw ,
  --entrypoint="install" ,
    fonoster/fonos:0.1.27
```

## Environment Variables

- `DOCKER_HOST_IP` - 
- `ENABLE_TLS` -
- `DOMAIN` -
- `HTTP_PORT` -
- `HTTPS_PORT` -
- `LETSENCRYPT_EMAIL` -
- `GLOBAL_SIP_DOMAIN` -
