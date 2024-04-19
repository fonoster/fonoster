# Asterisk PBX

> Docker image with a minimal Asterisk PBX

[![publish to docker hub](https://github.com/fonoster/fonoster/actions/workflows/release.yaml/badge.svg)](https://github.com/fonoster/fonoster/actions/workflows/release.yaml)

This repository contains a dockerized distribution of Asterisk PBX 16 for use in [Fonoster](https://github.com/fonoster/fonoster). For more documentation on how Fonoster images are constructed and how to work with them, please see the [documentation](https://github.com/fonoster/fonoster).

## Available Versions

You can see all images available to pull from Docker Hub via the [Tags](https://hub.docker.com/repository/docker/fonoster/asterisk/tags?page=1) page. Docker tag names that begin with a "change type" word such as task, bug, or feature are available for testing and may be removed at any time.

> The image tag is the same of the Asterisk this is image is based on

## Installation

You can clone this repository and manually build it.

```
cd fonoster/asterisk\:%%VERSION%%
docker build -t fonoster/asterisk:%%VERSION%% .
```

Otherwise you can pull this image from docker index.

```
docker pull fonoster/asterisk:%%VERSION%%
```

## Usage Example

The following is a basic example of using this image.

```
docker run -it \
  -p 6060:6060 \
  -p 10000-10010:10000-10010 \
  -e EXTERN_ADDR=${you host address} \
  -e SIPPROXY_HOST=${sip proxy address} \
  -e SIPPROXY_USERNAME=${username at sip proxy} \
  -e SIPPROXY_SECRET=${secret at sip proxy} \
  -e RTP_PORT_START=10000 \
  -e RTP_PORT_END=10010 \
  fonoster/asterisk
```

## Environment Variables

Environment variables are used in the entry point script to render configuration templates. You can specify the values of these variables during `docker run`, `docker-compose up`, or in Kubernetes manifests in the `env` array.

- `ARI_PROXY_URL` - URL for ARI API. Defaults to `http://localhost:8088`
- `ARI_USERNAME` - Username for ARI API. **Required**
- `ARI_SECRET` - Password for ARI API. **Required**
- `SIPPROXY_HOST` - The SIP Proxy's IP address. **Required**
- `SIPPROXY_PORT` - The SIP Proxy's port. Defaults `5060`
- `SIPPROXY_USERNAME` - Username at SIP Proxy. **Required**
- `SIPPROXY_SECRET` - Secret at SIP Proxy. **Required**
- `SIP_BINDADDR` - Where to listen for SIP traffic. Defaults to `0.0.0.0:6060`
- `RTP_PORT_START` - Lower limit of the RTP port range. **Required**
- `RTP_PORT_END` - Upper limit of the RTP port range. **Required**
- `DTMF_MODE` - DTMF mode. Defaults to `auto_info`
- `CODECS` - Comma separated list of codecs. Defaults to `ulaw,alaw,gsm,g722`
- `HTTP_BINDADDR` - Where to listen for HTTP traffic. Defaults to `0.0.0.0`

## Exposed ports

- `6060` - Default SIP port

## Volumes

No volumes are exposed.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/fonoster/fonoster/blob/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

- [Pedro Sanders](https://github.com/psanders)

See also the list of contributors who [participated](https://github.com/fonoster/fonoster/contributors) in this project.

## License

This project is licensed under the Internal License - see the [LICENSE](LICENSE) file for details.
