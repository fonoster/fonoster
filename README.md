# DodoPBX

DodoPBX is a cloud PBX built for the cloud base on Asterisk, [AstiveToolkit](http://astivetoolkit.org), 
and [Sip I/O](https://github.com/fonoster/sipio). It's not production ready and it doesn't do much yet. For questions or feature request go to the [issues](https://github.com/psanders/dodopbx/issues) section.

## Run with Compose

```bash
export EXTERN_ADDR={YOUR HOST ADDRESS}
docker-compose up
```

## Run in Kubernetes

Running in Kubernetes takes some extra steps. You must set the enviroment
variables ASTERISK_EXTERN_ADDR and ASTERISK_SIPPROXY_HOST on `k8s/mediaserver.yml`.
You also need to set SIPIO_EXTERN_ADDR in `k8s/sipproxy.yml`.

> This variables must be set to the public address(or if running locally your host address)

Additionally you must deploy the application `apps/helloworld.jar` in the `mediacontroller`.
If you are using Docker for Desktop just copy the file in the `tmp` file and share
the tmp as a Volume.

```bash
kubectl create -f k8s/configmaps.yml
kubectl create -f k8s/redis.yml
kubectl create -f k8s/mediacontroller.yml
kubectl create -f k8s/sipproxy.yml
kubectl create -f k8s/mediacontroller.yml
```

## Configuring the Endpoints

Use the information located on `bootstrap.yml` to configure your sip-phones.

## Limitations

We are currently unable to place calls using UDP likely do to a NAT issue.
