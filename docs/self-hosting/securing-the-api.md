# Securing the API

Securing Fonoster's API with Let's Encrypt certificates is essential to ensure encrypted communication. This process involves setting up a temporary Nginx server, obtaining the certificate, and configuring auto-renewal. Here's a guide to accomplish this task using Docker commands without docker-compose:

First, create the necessary directories for our setup:

```bash
mkdir -p letsencrypt/nginx-conf
mkdir -p letsencrypt/certbot/www
mkdir -p letsencrypt/certbot/conf
```

Next, create an Nginx configuration file named nginx.conf in the letsencrypt/nginx-conf directory with the following content:

```text
events {
  worker_connections 1024;
}

http {
  server {
    listen 80;
    listen [::]:80;
    server_name api.example.com;

    location /.well-known/acme-challenge/ {
      root /var/www/html;
    }

    location / {
      return 404;
    }
  }
}
```

Replace example.com with your domain name and remember to point the domain to the server's IP address.

Then, start the Nginx container to handle the ACME challenge:

```bash
docker run -d --name nginx \
  -p 80:80 \
  -v $(pwd)/letsencrypt/nginx-conf/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/letsencrypt/certbot/www:/var/www/html \
  nginx:latest
```

Now, run Certbot to obtain the Let's Encrypt certificate:

```bash
docker run -it --rm \
  -v $(pwd)/letsencrypt/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/letsencrypt/certbot/www:/var/www/html \
  certbot/certbot certonly --webroot \
  --webroot-path /var/www/html \
  --email your@email.com --agree-tos --no-eff-email \
  -d api.example.com
```

Replace the email and domain name with your information.

After obtaining the certificate, stop and remove the temporary Nginx container:

```bash
docker stop nginx
docker rm nginx
```

Finally, set up auto-renewal by creating a script named renew_cert.sh:

```bash
#!/bin/bash

docker run --rm \
 -v $(pwd)/letsencrypt/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/letsencrypt/certbot/www:/var/www/html \
 certbot/certbot renew
```

Make the script executable and add a cron job to run it twice daily:

```bash
chmod +x renew_cert.sh
(crontab -l 2>/dev/null; echo "0 0,12 * * * /path/to/renew_cert.sh") | crontab -
```

Replace /path/to with the actual path to the script.

By following these steps, you'll have successfully secured Fonoster's API with Let's Encrypt certificates and set up auto-renewal to maintain the security of your communications.