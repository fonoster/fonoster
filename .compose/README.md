# Running Project Fonos with Docker Composer

## Running Project with Docker Compose

To run Fonos using Docker Compose, simply run the following command:

```bash
docker-compose -f 00_config.yml \
    -f 01_base.yml \
    -f 02_sbc.yml \
    -f 03_tts.yml \
    -f 04_mediacontroller.yml \
    -f 05_mediaserver.yml \
    -f 06_logging.yml up \
    -d 
```

