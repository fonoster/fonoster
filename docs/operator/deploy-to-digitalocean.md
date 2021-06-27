# Deploy to Digital Ocean

The following script will assist you in quickly deploying PF to a Digital Ocean droplet. Notice that this script requires that you have a cloud-config.txt file beside it. You may obtain a copy of the current version of the cloud-config.txt from PF’s main repository.

To deploy digital ocean you first need to [signup for an account](https://www.digitalocean.com/?refcode=2962aa9e56a1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=CopyPaste) at DO. You will also need to download and setup `doctl`, for which we recommend the guide from the [doctl's repo.](https://github.com/digitalocean/doctl/blob/main/README.md#authenticating-with-digitalocean)

Then, download the [cloud-config.txt](https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt) with:

```bash
curl https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt -o cloud-config.txt
```

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

You can access your VM and follow the installation process. From within the VM, run the the next command:

```bash
tail -f /var/log/cloud-init-output.log
```

Once you see "Cloud init is done!" the process is complete. If everything went well you will be able to login to your PF deployment.

To login for the first time to your deployment, first get your admin credentianls with:

```bash
cat /opt/fonos/config/admin_credentials
```

Your output will look like the one bellow

```bash
{
   "accessKeyId":"admin",
   "accessKeySecret":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Finally, obtain your VM's IP from the DO's dashboard. With the `accessKeyId`, `accessKeySecret`, and your VM's IP address you can now login with

```bash
fonos auth:login
```
