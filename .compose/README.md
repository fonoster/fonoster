Run base project

```
docker-compose -f config.yml \
    -f base.yml \
    -f logging.yml \
    -f logging.yml up
```

Execute the following command with the infrastructure running:

```bash
docker run -it -v fonos_config:/certs \
    fonoster/jwthelper 

docker run -it -v fonos_config:/config fonoster/confighelper sh -c 'cat /config/config'  > ~/.fonos/config
```

Monitoring the deployment

Run 

```bash
docker-compose -f logging.yml -d
```