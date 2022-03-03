# Docker-backed infrastructure

> Docker-backed infrastructure management for the Fonoster application stack.

The easiest way to start running your Fonoster server is with our docker-in-docker (dind) installer.
Before running the installation command, make sure you have Docker Engine installed on your machine:

#### Install (Happy path)

Install application with the latest version available.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster
```

#### Install (With extra services)

Install application with the latest version and add additional services.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  -e EXTRA_SERVICES=secrets,fs \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster
```

#### Install (Passing version)

Install the app with the provided version.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  -e EXTRA_SERVICES=secrets,fs \
  -e FONOSTER_VERSION=0.3.3 \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster
```

#### Install (Verbose mode)

Display all logs of each process or command.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  -e VERBOSE=true \
  -e FONOSTER_VERSION=0.3.3 \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster
```

#### Update (Happy path)

Update your current installation to the latest patch for your current version. (e.g. 0.3.0 => 0.3.3)

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/update.sh" \
  fonoster/fonoster
```

#### Update (Passing version and verbose)

Update your current installation to the provided version. (if it's the same version with different patches)

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  -e FONOSTER_VERSION=0.3.3 \
  -e VERBOSE=true \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/update.sh" \
  fonoster/fonoster
```