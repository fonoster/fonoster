# Running Project Fonos with Docker Composer

## Run base project

```
docker-compose -f 00_config.yml \
    -f 01_base.yml \
    -f 02_sbc.yml \
    -f 03_tts.yml \
    -f 04_mediacontroller.yml \
    -f 05_mediaserver.yml \
    -f 06_logging.yml up \
    -d 
```

Execute the following command with the infrastructure running:

```bash
docker run -it -v fonos_config:/certs \
    fonoster/jwthelper 

docker run -it -v fonos_config:/config fonoster/confighelper sh -c 'cat /config/config'  > ~/.fonos/config
```
