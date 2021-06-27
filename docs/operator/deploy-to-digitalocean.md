# Deploy your server

With this guide you will learn how to install Project Fonos(PF), wheather on a self-hosted environment or in the cloud. You will learn about the available installation options, and which one is the best for current journey with PF.

## Self-hosted or Cloud

They are several considerantion to decide which deployment method to use. The main factors you should consider are costs and availability. Running the server in a cloud environment will likely be more stable than a home Internet connection. The cloud also gives you the advantange of not having to worry about phisical servers, electricity, etc.

However, if you have a stable Internet with good bandwith, running a local server might be a good option specially while you are exploring PF.

## Using Multipass for a rapid deployment

Have you heard about Multipass? Multipass is a Canonical project that offers a lightweight VM manager for Linux, Windows and macOS. With Multiplass you can deploy Project Fonos in a local environment in a single-command. This deployment menthod is by far the fasted way to get started with PF.

> This is a good way to started with `PF`, but keep in mind that it will not configure TLS for you

Deploy PF to Multipass with the following steps.

Download the [cloud-config.txt](https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt) file into a local directory

```bash
curl https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt -o cloud-config.txt
```

From the same directory fire up Multipass 

```bash
multipass launch --name fonos --disk 10G --cpus 2 --mem 4G --cloud-init cloud-config.txt
```

It is possible that you will see a "timed out waiting for initialization to complete", specially in a slow Internet connection.
Don't worry about it. It's ok. 

You can access your VM and follow the installation process

```
multipass shell fonos
tail -f /var/log/cloud-init-output.log
```

