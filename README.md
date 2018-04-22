# DodoPBX

DodoPBX is a PBX built for the cloud base on Asterisk and Sip I/O. It's not
production ready and it doesn't do much yet. For questions or feature request
go to the [issues](https://github.com/psanders/dodopbx/issues) section.

# Run with Compose

```bash
export EXTERN_ADDR={YOUR HOST ADDRESS}
docker-compose up
```

# Run in Kubernetes

The media controller requires of a FastAGI application built with
the AstiveToolkit.

```bash
kubectl create -f k8s/configmaps.yml
kubectl create -f k8s/redis.yml
kubectl create -f k8s/mediacontroller.yml
kubectl create -f k8s/sipproxy.yml
kubectl create -f k8s/mediacontroller.yml
```
