
# Run Fonos in K8S

## Prerequisite 

- Docker Engine
- Kubernetes Cluster
- NPM

> This was tested in Minikube with K8S 1.18. Minikube was launched using hyperkit.

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

## Creating and Installing the SSL certificates

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

## Create secret base on tls certificates

```
cd certs
kubectl create secret tls fonos-certs --key tls.key --cert tls.crt
secret "fonos-certs" created
```

## Add your domain to your `/etc/hosts` (Only if using Minikube)

If you are using Minikube you must perform this extra step. First find your cluster IP by running the follow command

```
minikube service fonos-apiserver --url
```

Add the IP in the output to your `/etc/hosts`. 

> Use the same domain you used in your self-signed certificate.

## Login to the server

Setup the certificates in your environment variable `CERTS_PATH`. Then, run the `fonos login` command and follow the
prompt.
 
> Add api.fonos your `/etc/hosts` if running locally with minikube

```
fonos login
```


