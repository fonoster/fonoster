## Run in Kubernetes

Running in Kubernetes takes some extra steps. You must set the enviroment
variables CASTK_EXTERN_ADDR and CASTK_SIPPROXY_HOST on `k8s/mediaserver.yml`.
You also need to set ROUTR_EXTERN_ADDR in `k8s/sipproxy.yml`.

> This variables must be set to the public address(if running Routr locally use your host address)

Additionally, you must create the following Kubernettes resources:

```bash
kubectl create -f k8s/configmaps.yml
kubectl create -f k8s/redis.yml
kubectl create -f k8s/mediaserver.yml
kubectl create -f k8s/sipproxy.yml
```
