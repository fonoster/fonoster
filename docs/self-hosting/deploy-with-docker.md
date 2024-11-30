# Deploy with Docker

Docker Compose is the easiest way to deploy a self-hosted instance of Fonoster. This guide will walk you through deploying the Fonoster services using Docker and Docker Compose.

## Prerequisites

The only prerequisite for Fonoster is to have [Docker](https://docs.docker.com/get-docker/) installed on the host machine.

## Installation

First, create a new directory in your preferred location and change to it. The root directory we will use in the guide is `fonoster.`

```bash
mkdir -p fonoster/config
cd fonoster
```

Next, copy the `.env.example` from the repository to the current directory and rename it to `.env.` This file contains all the environment variables that the services need to run. You can use the following command to copy the file:

```bash
curl -o .env https://raw.githubusercontent.com/fonoster/fonoster/0.6/.env.example
curl -o ./compose.yaml https://raw.githubusercontent.com/fonoster/fonoster/0.6/compose.yaml
curl -o ./config/integrations.json https://raw.githubusercontent.com/fonoster/fonoster/0.6/config/integrations.example.json
curl -o ./config/envoy.yaml https://raw.githubusercontent.com/fonoster/fonoster/0.6/config/envoy.yaml
```

Then, open the `.env` file with your favorite editor and update the following variables:

- `DOCKER_HOST_ADDRESS`: The public IP address of your Docker host. If running locally, you can use your local IP address. If you are running the application on a server, you must use a routable IP address for the server.
- `ASTERISK_SIPPROXY_HOST`: Set this variable to the IP address of the host machine.

In addition to the previous variables, you should update all the secrets and ensure the `.env` file is safely stored.

Next, generate a set of public and private keys for the server. You can use the following command to generate the keys:

```bash
mkdir -p config/keys
openssl genpkey -algorithm rsa -out config/keys/private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in config/keys/private.pem -out config/keys/public.pem
chmod 644 config/keys/*
```

Your directory structure should look like this:

```bash
.
├── .env
├── compose.yaml
└── config
    ├── envoy.yaml
    ├── integrations.json
    └── keys
        ├── private.pem
        └── public.pem

3 directories, 6 files
```

Finally, run the following command to start the application:

```bash
docker compose up -d
```

After a few moments, you can visit the URL you set in the `APP_URL` variable. For example, if you put the variable to `http://localhost:8080`, you can access the application by visiting [http://localhost:8080](http://localhost:8080) in your browser.

## Known Issues

- Running Fonoster in Windows is not currently supported because the RTPEngine container is unavailable for Windows. No workaround is available at this time.