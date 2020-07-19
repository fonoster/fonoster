# Project Fonos

Project Fonos assembles the components needed to deploy a telephony system. It helps VoIP integrators quickly deploy new networks and include value-added services such as Programmable Voice, Messaging, and Video.

Project Fonos: https://github.com/fonoster/fonos

## Introduction

This chart bootstraps Project Fonos for deployment on a [Kubernetes](https://kubernetes.io/) cluster using the [Helm](https://helm.sh/) package manager.

## Prerequisites

- Kubernetes 1.18+
- Helm 3.0-beta3+
- PV provisioner support in the underlying infrastructure

## Installing NGINX Ingress Controller

To enable the NGINX Ingress controller, run the following command:

```
minikube addons enable ingress
```

Verify that NGINX Ingress controller is running

```
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

## Creating and Installing the SSL certificates and JWT Token

Simply replace the subject with your own domain. Generate the server certificates using the `fonoster/certshelper` docker image, as follows:

```
docker run -it \
  -v $(pwd)/certs:/certs \
  -e SUBJECT=api.fonos \
  -e CERT_NAME=tls \
  fonoster/certshelper
```

And the client certificates:

```
docker run -it \
  -v $(pwd)/certs:/certs \
  -e SUBJECT=api.fonos \
  -e CERT_NAME=client \
  fonoster/certshelper
```

Create a JWT token and the corresponding private key:

```
docker run -it \
  -v $(pwd)/certs:/certs \
  fonoster/jwthelper
```

> We don't recommend using Self Signed Certificates for production environments

Finally, install the certificates and the token as Kubernetes secrets:

```
cd certs
kubectl create secret tls fonos-certs --key tls.key --cert tls.crt
kubectl create secret generic fonos-access --from-file=./access --from-file=./jwt.salt
```


## Add this Helm repository to your Helm client

```
helm repo add fonoster https://fonoster.github.io/fonos
```

## Installing the Chart

To install the chart with the release name my-release:

```
kubectl create namespace fonos
helm install my-release fonoster/fonos --namespace fonos
```

The command deploys Project Fonos in the `fonos` namespace on the Kubernetes cluster in the default configuration.

> We recommend using a namespace for easy upgrades.

## Add your domain to your `/etc/hosts` (Only if using Minikube)

If you are using Minikube you must perform this extra step. First, find your cluster IP by running the following command:

```
minikube service fonos-apiserver --url
```

Add the IP in the output to your `/etc/hosts`. 

> Use the same domain of your self-signed certificate.

## Uninstalling the Chart

To uninstall/delete the `my-release` deployment:

```bash
$ helm uninstall my-release
```

The command removes all the Kubernetes components associated with the chart and eliminates the release.

## Changelog

The [CHANGELOG](https://github.com/fonoster/fonos/tree/gh-pages/charts/CHANGELOG.md) provides notable changes on the chart.

## Parameters

The following table lists the configurable parameters of the Routr chart and their default values.

Coming soon.

### Redis Values

The following values are taken from Bitnami Helm Chart. Please refer to https://bitnami.com/stack/redis/helm

Here are default values:

```
redis:
  redisPort: 6379
  image:
    registry: docker.io
    repository: bitnami/redis
    tag: latest
    pullPolicy: Always
  usePassword: false
  cluster:
    enabled: false  
  persistence:
    enabled: true
    mountPath: /bitnami/redis
    size: 5Gi
```

## Specifying Values

Specify each parameter using the --set key=value[,key=value] argument to helm install. For example,

```bash
helm upgrade --wait fonos 
--set sipproxy.serviceType=LoadBalancer \
fonoster/fonos  
```

Alternatively, you can provide a YAML file that specifies the above parameters' values while installing the chart. For example:

```bash
helm install --wait fonos -f values.yaml fonoster/fonos
```
