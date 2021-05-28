# NodeJS Media Controller

> Media Controller based on NodeJS for Project Fonos

[![release](https://github.com/fonoster/fonos/actions/workflows/release.yml/badge.svg)](https://github.com/fonoster/fonos/actions/workflows/release.yml)

The role of service is to receive `AGI` requests from Asterisk servers and pass control of the call to your application. This image implements most of the support needed to run Fonos Programmable Voice features.

![Highlevel ARQ](https://raw.githubusercontent.com/fonoster/fonoster/master/mods/dispatcher/diagram.png "Media Controller, high-level diagram")

For more documentation on how Fonos images are constructed and how to work with them, please see the [documentation](https://github.com/fonoster/fonos).

## Available Versions

You can see all images available to pull from Docker Hub via the [Tags](https://hub.docker.com/repository/registry-1.docker.io/fonoster/fonos-nodejsmc/tags?page=1) page. Docker tag names that begin with a "change type" word such as task, bug, or feature are available for testing and may be removed at any time.

## Installation

You can clone this repository and manually build it.

```
cd fonos-nodejsmc
docker build -t fonoster/fonos-nodejsmc:%%VERSION%% .
```

Otherwise you can pull this image from docker index.

```
docker pull fonoster/fonos-nodejsmc:latest:%%VERSION%%
```

## Usage Example

The following is a minimal example of using this image.

```bash
docker run -it \
    -v /path/to/apps:/home/fonos/apps
    -p 4573:4573 \
    fonoster/fonos-nodejsmc
```

## Environment Variables

Run environment variables are used in the entry point script to render configuration templates. You can specify the values of these variables during `docker run`, `docker-compose up`, or in Kubernetes manifests in the `env` array.

- `AGI_PORT` - Port to listen to AGI requests from Asterisk Servers. Defaults to `4573`
- `APPS_DIR` - Here is where your applications live. Defaults to `/home/fonos/apps`
- `API_ACCESS_FILE` - Contains the credentials and endpoint information to connect with an APIServer. The default location for this file is `~/.fonos/access`
- `APISERVER_ENDPOINT` - Endpoint for the APIServer

## Exposed ports

- `4573` - Default AGI port for connection from Asterisk Severs

## Volumes

- `/home/fonos/apps` - Default mount point for applications
