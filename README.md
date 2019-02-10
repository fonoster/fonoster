# YAPS - Yet Another Phone System

YAPS is a PBX built for the cloud base on [Routr](https://routr.io) and Asterisk. It's not production ready and it doesn't do much yet. For questions or feature request go to the [issues](https://github.com/fonoster/yaps/issues) section.

## Run with Compose

```bash
export HOST_ADDR={YOUR HOST ADDRESS}
docker-compose up
```

## Run in Kubernetes

Running in Kubernetes takes some extra steps. You must set the enviroment
variables CASTK_EXTERN_ADDR and CASTK_SIPPROXY_HOST on `k8s/mediaserver.yml`.
You also need to set ROUTR_EXTERN_ADDR in `k8s/sipproxy.yml`.

> This variables must be set to the public address(if running locally use your host address)

Additionally you must deploy the application `apps/helloworld.jar` in the `mediacontroller`.
If you are using Docker for Desktop just copy the file in the `tmp` file and share
the tmp as a Volume.

```bash
kubectl create -f k8s/configmaps.yml
kubectl create -f k8s/redis.yml
kubectl create -f k8s/mediacontroller.yml
kubectl create -f k8s/sipproxy.yml
```

## Configuring the Endpoints

Use the information located on `bootstrap.yml` to configure your sip-phones.

## Limitations

We are currently unable to place calls using UDP do to NAT issues.
