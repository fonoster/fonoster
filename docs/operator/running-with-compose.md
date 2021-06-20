# Running Project Fonos with Docker Compose

The following steps will assist you in deploying `PF` using docker-compose. Please go to [discussions](https://github.com/fonoster/fonos/discussions) to ask questions to the community and [github issues](https://github.com/fonoster/fonos/issues) to report any bad behavior on the project. 

## Prepare the environment

While using multipass is optional, it will help you keep your environment clean.

To install multipass, simply use the following command:

```bash
multipass launch --name fonos \
--disk 8G \
--cpus 2 \
--mem 4G
```

Then, enter to the machine with:

```bash
multipass shell fonos
sudo apt update
sudo apt install docker.io docker-compose
```

Finally, create two external volumes `datasource` and `data1-1`:

```bash
docker volume create --name=datasource
docker volume create --name=data1-1
```

## Run PF with docker-compose

To run `PF`, first clone the repo and go to the directory `.compose` with:

```bash
git clone https://github.com/fonoster/fonos --depth=1
cd .compose
```

Then, copy the `env_example` into `.env` and update the variables `CONFIG`, `DOMAIN`, and `HOST_ADDR.`

Next, run the core services with:

```bash
sudo docker-compose --env-file .env \
    -f 00_deps.yml \
    -f 01_api.yml \
    -f 02_sipnet.yml up
```

Finally, once all the services are up an running initialize `PF` with:

```bash
docker-compose -f init.yml up
```

## Launch additional services (Optional)

```bash
git clone https://github.com/fonoster/fonos --depth=1
cd .compose
sudo docker-compose --env-file .env \
    -f 00_deps.yml \
    -f 01_api.yml \
    -f 02_sipnet.yml \
    -f extras/secrets.yml \
    -f extras/funcs.yml \    
    -f extras/events.yml \
    -f extras/logging.yml \
    -f extras/tts.yml \
    up
```

> Append `dev.yml` or `extras\*.dev.yml` if you want to open the ports on all the services (Only recommended for development)