
# Install Minikube
# Run Fonos in Minikube
# Installing NGINX Ingress Controller

To enable the NGINX Ingress controller, run the following command:

```
minikube addons enable ingress
```

Verify that the NGINX Ingress controller is running

```
kubectl get pods -n kube-system
```

> Note: This can take up to a minute.
Output:

```
NAME                                        READY     STATUS    RESTARTS   AGE
default-http-backend-59868b7dd6-xb8tq       1/1       Running   0          1m
kube-addon-manager-minikube                 1/1       Running   0          3m
kube-dns-6dcb57bcc8-n4xd4                   3/3       Running   0          2m
kubernetes-dashboard-5498ccf677-b8p5h       1/1       Running   0          2m
nginx-ingress-controller-5984b97644-rnkrg   1/1       Running   0          1m
storage-provisioner         
```

# Creating and Installing certificates

Simply replace the subjecy with your own domain

Generate server certificates

```
docker run -it \
  -v $(pwd)/certs:/certs \
  -e SUBJECT=api.fonos \
  -e CERT_NAME=tls \
  fonoster/certshelper
```

Generate client certificates

```
docker run -it \
  -v $(pwd)/certs:/certs \
  -e SUBJECT=api.fonos \
  -e CERT_NAME=client \
  fonoster/certshelper
```

Create secret base on tls certificates

```
cd certs
kubectl create secret tls fonos-certs --key tls.key --cert tls.crt
secret "fonos-certs" created
```
> Must make certs available with env CERTS_PATH

# Login to the server

> Add api.fonos your /etc/hosts


Login

```fonos login```

```
endpoint=api.fonos:443
accessKeyId=fonos
accessKeySecret=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJU1MiOiJmb25vcyIsInN1YiI6ImZvbm9zIiwiaWF0IjoxNTk0Njc0MjQxfQ.7iedQpoXxVgBPdxZzmgVba4HY_hK_UZP8jiH1Skp6YA
```

# Minimal configuration