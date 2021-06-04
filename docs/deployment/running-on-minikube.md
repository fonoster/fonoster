## Prerequisites (Deprecated)

- Kubernetes 1.18+
- Helm 3.0-beta3+
- [Fonos CTL](https://www.npmjs.com/package/@fonos/ctl)
- PV provisioner support in the underlying infrastructure
- Nginx ingress Controller

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

> If you are having issues enabling the addon, and you are on OSX, try starting minikube with the `Hyperkit` driver

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

## Creating and Installing the SSL certificates and JWT Token

Run the following commmand to create and install the certificates and the token:

```
fonos config:init
```

## Installing Fonos in your Cluster

Run the following command to install Fonos in your minikube:

```bash
helm install --wait my-release \
--set sipproxy.externAddr=$(minikube ip) \
--set sipproxy.service.type=NodePort \
--set mediaserver.externAddr=$(minikube ip) \
--set mediaserver.service.type=NodePort \
fonoster/fonos
```

> Take your minikube's IP and create a new entry in your local DNS host file. The host must match your initial configuration(defaults to `fonos.local`).

# Exposing SIP ports in Nginx Controller (Optional)

Patch Nginx Controller to accept tcp and udp traffic.

First,

```
kubectl patch configmap tcp-services -n kube-system --patch '{"data":{"6060":"default/fonos-mediaserver:6060"}}'
kubectl patch configmap tcp-services -n kube-system --patch '{"data":{"5060":"default/fonos-sipproxy:5060"}}'
kubectl patch configmap udp-services -n kube-system --patch '{"data":{"5060":"default/fonos-sipproxy:5060"}}'
```

Then,

```
kubectl patch deployment ingress-nginx-controller --patch "$(cat ingress-nginx-controller-patch.yaml)" -n kube-system
```

```
spec:
  template:
    spec:
      containers:
      - name: controller
        ports:
         - containerPort: 4567
           hostPort: 4567
         - containerPort: 5060
           hostPort: 5060
         - containerPort: 6060
           hostPort: 6060
```

> Replace `kube-system` with nginx namespace and `default` with your the namespace of your release