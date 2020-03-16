## Maintainer

Pedro Sanders | [psanders@fonoster.com](mailto:psanders@fonoster.com)

## Description

Media Server base on Asterisk PBX

## Run Environment

Run environment variables are used in the entry point script to render
configuration templates. The values of this variables can be specified during
docker run, or in kubernetes manifests in the env array.

- MS_ARI_USERNAME
- MS_ARI_SECRET
- MS_ARI_APP
- MS_SIPPROXY_HOST
- MS_SIPPROXY_USERNAME
- MS_SIPPROXY_SECRET
- MS_SIP_BINDADDR
- MS_EXTERN_ADDR
- MS_LOCALNET

## Usage

### Under docker (pre-built)

**Pull the images**

`docker pull fonoster/castk`

**To run:**

```bash
docker run -it \
    -p 6060:6060 \
    fonoster/castk
```

### Under docker-compose

**Pull the images**

`docker-compose pull`

**To run:**

```bash
export HOST_ADDR=${your host address}
docker-compose up --abort-on-container-exit
```

**Destroying the container**

`docker-compose down`
