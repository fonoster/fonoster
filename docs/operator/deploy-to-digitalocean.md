# Deploy to Digital Ocean

The following script will assist you in quickly deploying PF to a Digital Ocean droplet. Notice that this script requires that you have a cloud-config.txt file beside it. You may obtain a copy of the current version of the cloud-config.txt from PF’s main repository.

To deploy digital ocean you first need to [signup for an account](https://www.digitalocean.com/?refcode=2962aa9e56a1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=CopyPaste) at DO. You will also need to download and setup `doctl`, for which we recommend DO's [offitial guide.](https://github.com/digitalocean/doctl/blob/main/README.md#authenticating-with-digitalocean).

Next, download the [cloud-config.txt](https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt) with:

```bash
curl https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt -o cloud-config.txt
```

Next export your DO token and deploy your droplet with the following command:

```bash
DOTOKEN=e8cfa2f5ac6186a86532...
doctl compute droplet create myserver \
  --region nyc3 \
  --access-token $DOTOKEN \
  --size s-2vcpu-4gb \
  --user-data-file cloud-config.txt \
  --image debian-10-x64
```