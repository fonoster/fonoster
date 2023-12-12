---
slug: Deploying Fonoster with Cloud-Init
title: Deploying Fonoster with Cloud-Init
authors: [psanders]
tags: [fonoster, voice, javascript, voice]
---

# Deploying Fonoster with Cloud-Init

At [Fonoster Inc](https://fonoster.com/), we want to help companies and individuals that wish to adopt Fonoster as their Programmable Telecommunications solution. To help archive this goal, our team uses Cloud-Init for cloud instance initialization.

You can deploy Fonoster to all major public cloud providers, private cloud infrastructure, and bare-metal installations with Cloud-Init.

In this tutorial, we will also use Multipass.

Multipass is a Canonical project that offers a lightweight VM manager for Linux, Windows, and macOS. With Multipass, you can deploy Fonoster on Ubuntu in a local environment in a single command. This deployment method is by far the fastest way to get started with Fonoster.

## Requirements
Before you start this tutorial, you will need the following:

- [Multipass](https://multipass.run/)
- NodeJS 14+ (Use nvm if possible)
- Fonoster command-line tool (install with `npm install -g @fonoster/ctl`)

## Deploying to Multipass
> This method will not automatically enable TLS for you

Deploy Fonoster to Multipass with the following steps. First, download the [cloud-config.txt](https://raw.githubusercontent.com/fonoster/fonoster/main/operator/cloud-config.txt) file into a local directory with:
```none
curl https://raw.githubusercontent.com/fonoster/fonoster/main/operator/cloud-config.txt -o cloud-config.txt
```

Since we are running locally, we have to modify the `cloud-config` to discover the private ipv4 instead of the public ipv4.

First, update `cloud-config` with:

```none
sed -i.bak -e "s#publicv4#privatev4#g" "cloud-config.txt"
```

Then, from the same directory, fire up Multipass.

```none
multipass launch --name fonoster --disk 8G --cpus 2 --mem 4G --cloud-init cloud-config.txt
```

You might see a `timed out waiting for initialization to complete`, especially in a slow Internet connection. Don't worry. The process will continue in the background.

You can access your VM and continue following the installation process with:

```none
multipass shell fonoster
tail -f /var/log/cloud-init-output.log
```
Once you see "Cloud init is done!" the process is complete. If everything goes well, you will be able to log in to your Fonoster deployment. To authenticate for the first time to your deployment, first get your admin credentials with:
```none
cat /opt/fonoster/config/admin_credentials
```
Your output will look like the one below.
```none
{
   "accessKeyId": "admin",
   "accessKeySecret": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
Next, from the host machine, obtain your VM's IP with:
```none
multipass info fonoster
```

Look for the entry starting with IPv4.
```none
Name:           fonoster
State:          Running
IPv4:           192.168.64.39
                172.17.0.1
                172.24.0.1
...
```

With the `accessKeyId`, `accessKeySecret`, and your VM's IP address, you can now login using the command-line tool or access your server with the SDK.

### What's next?

For more deployment options, be sure to check the [operator's section of Fonoster's documentation](https://github.com/fonoster/fonoster/blob/main/docs/operator/deploy-your-server.md). 

Star the project on [Github](https://github.com/fonoster) and contact us via:

- Twitter: [@fonoster](https://twitter.com/intent/follow?screen_name=fonoster)
- Email: fonosterteam@fonoster.com
- [Discord](https://discord.gg/4QWgSz4hTC)
