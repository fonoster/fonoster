## Starting Minikube

Start minikube using at least 4GB of memory

```bash
minikube start --memory=4052
```

## Installing NGINX Ingress Controller

To enable the NGINX Ingress controller, run the following command:

```bash
minikube addons enable ingress
```

> If you are having issues enabling the addon, and you are on OSX, try starting minikube with the Hyperkit driver

Verify that NGINX Ingress controller is running

```bash
kubectl get pods -n kube-system
```

> Note: This can take up to a minute.

Your output should look like this:

```
NAME                                        READY     STATUS    RESTARTS   AGE
default-http-backend-59868b7dd6-xb8tq       1/1       Running   0          1m
kube-addon-manager-minikube                 1/1       Running   0          3m
kube-dns-6dcb57bcc8-n4xd4                   3/3       Running   0          2m
kubernetes-dashboard-5498ccf677-b8p5h       1/1       Running   0          2m
nginx-ingress-controller-5984b97644-rnkrg   1/1       Running   0          1m
storage-provisioner         
```

## Installing Fonos in your Cluster

First, find your cluster IP by running the following command:

```bash
minikube service list
```

Your output should look like this:

```
|-------------|------------------------------------|--------------|----------------------------|
|  NAMESPACE  |                NAME                | TARGET PORT  |            URL             |
|-------------|------------------------------------|--------------|----------------------------|
| default     | fonos-apiserver                    | grpc/50052   | http://192.168.64.29:31014 |
| default     | fonos-mediacontroller              | No node port |
| default     | fonos-mediaserver                  | sip/6060     | http://192.168.64.29:30001 |
|             |                                    | rtp1/30005   | http://192.168.64.29:30005 |
|             |                                    | rtp2/30006   | http://192.168.64.29:30006 |
|             |                                    | rtp3/30007   | http://192.168.64.29:30007 |
|             |                                    | rtp4/30008   | http://192.168.64.29:30008 |
| default     | fonos-minio                        | No node port |
| default     | fonos-rabbitmq                     | No node port |
| default     | fonos-rabbitmq-headless            | No node port |
| default     | fonos-redis-headless               | No node port |
| default     | fonos-redis-master                 | No node port |
| default     | fonos-sipproxy                     | sig/5060     | http://192.168.64.29:30678 |
|             |                                    | api/4567     | http://192.168.64.29:32526 |
| default     | fonos-ttsengine                    | No node port |
| default     | kubernetes                         | No node port |
| kube-system | ingress-nginx-controller-admission | No node port |
| kube-system | kube-dns                           | No node port |
|-------------|------------------------------------|--------------|----------------------------|
```

Take the IP from the URL column (in this case 192.168.64.29), and create an entry in your local DNS host file. The host must 
match your initial configuration. 

Finally, you need to overwrite the external address for your `sipproxy` and `mediaserver`. This is only neccesary when running Fonos in a local cluster.

```bash
helm --wait install \
--set sipproxy.externAddr=192.168.64.28 \
--set mediaserver.externAddr=192.168.64.28 \
fonoster/fonos 
```
