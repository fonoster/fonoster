# Deploy to Multipass

Have you heard about Multipass? Multipass is a Canonical project that offers a lightweight VM manager for Linux, Windows, and macOS. With Multipass, you can deploy Project Fonos in a local environment in a single command. This deployment method is by far the fasted way to get started with PF.

> This method will not automatically enable TLS for you. You will also need to deactivate TLS on the client-side by setting the environment variable `ALLOW_INSECURE` to true. 

Deploy PF to Multipass with the following steps. First, download the [cloud-config.txt](https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt) file into a local directory with:

```bash
curl https://raw.githubusercontent.com/fonoster/fonos/main/operator/cloud-config.txt -o cloud-config.txt
```

Since we are running locally, we have to modify the cloud-config to discover the private ipv4 instead of the public ipv4. First, update your cloud config with:

```bash
sed -i.bak -e "s#publicv4#privatev4#g" "cloud-config.txt"
```

Then, from the same directory, fire up Multipass

```bash
multipass launch --name fonos --disk 10G --cpus 2 --mem 4G --cloud-init cloud-config.txt
```

You might see a "timed out waiting for initialization to complete", especially in a slow Internet connection. Don't worry. The process will continue in the background. You can access your VM and continue to follow the installation process with:

```bash
multipass shell fonos
tail -f /var/log/cloud-init-output.log
```

Once you see "Cloud init is done!" the process is complete. If everything went well, you will be able to log in to your PF deployment. To log in for the first time to your deployment, first, get your user credentials with:

```bash
cat /opt/fonos/config/user_credentials
```

Your output will look like the one bellow.

```bash
{
   "accessKeyId":"fonos",
   "accessKeySecret":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Next, obtain your VM's IP with:

```bash
multipass info fonos
```

Look for the entry starting with IPv4.

```bash
Name:           fonos
State:          Running
IPv4:           192.168.64.39
                172.17.0.1
                172.24.0.1
...
```

With the `accessKeyId`, `accessKeySecret`, and your VM's IP address, you can now login using the command-line tool or access your server with the SDK.
