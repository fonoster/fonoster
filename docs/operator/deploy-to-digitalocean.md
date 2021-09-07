# Deploy to Digital Ocean

This quick guide will assist you in rapidly deploying PF to a Digital Ocean droplet.

To deploy to Digital Ocean, you first need to [signup for an account](https://www.digitalocean.com/?refcode=2962aa9e56a1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=CopyPaste). You will also need to download and setup the `doctl`, using the guide from the [doctl's repo.](https://github.com/digitalocean/doctl/blob/main/README.md#authenticating-with-digitalocean)

Then, download the [cloud-config.txt](https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt) with:

```bash
curl https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt -o cloud-config.txt
```

>  You must replace the public key with your own public keys from `~/.ssh/id_rsa.pub`, in the cloud-config.txt

Next, export your DO token and deploy your droplet with the following command:

```bash
DOTOKEN=e8cfa2f5ac6186a86532...
doctl compute droplet create myserver \
  --region nyc3 \
  --access-token $DOTOKEN \
  --size s-2vcpu-4gb \
  --user-data-file cloud-config.txt \
  --image debian-10-x64
```

> 💡 TIP: You could also add the `--ssh-keys` to ease future access your droplet

You can access your VM and follow the installation process. From within the VM, run the next command:

```bash
tail -f /var/log/cloud-init-output.log
```

Once you see "Cloud init is done!" the process is complete. If everything went well, you will be able to log in to your PF deployment.

To log in for the first time to your deployment, first, get your admin credentials with:

```bash
cat /opt/fonos/config/admin_credentials
```

Your output will look like the one bellow.

```bash
{
   "accessKeyId":"admin",
   "accessKeySecret":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Finally, obtain your VM's IP from the DO's dashboard. With the `accessKeyId`, `accessKeySecret`, and your VM's IP address, you can now login with the command-line tool or access the deployment with the SDK.
