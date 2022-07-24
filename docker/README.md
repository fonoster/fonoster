# Docker-in-Docker(dind) Installation and Update Examples

The following examples show-case using Fonsoter's dind operator. Before using this operator, be sure you have Docker Engine installed on your machine:

#### Install (Happy path)

Install the application with the latest version available.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster:0.3.12
```

#### Install (With extra services)

Install the application with the latest version and add additional services.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  -e EXTRA_SERVICES=secrets,fs \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster:0.3.12
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
  fonoster/fonoster:0.3.12
```

#### Install (Verbose mode)

Display all logs of each processor command.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  -e VERBOSE=true \
  -e FONOSTER_VERSION=0.3.3 \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/install.sh" \
  fonoster/fonoster:0.3.12
```

#### Update (Happy path)

Update your current installation to the latest patch for your current version. (e.g. 0.3.0 => 0.3.3)

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/update.sh" \
  fonoster/fonoster:0.3.12
```

#### Update (Passing version and verbose)

Update your current installation to the provided version. (if it's the same version with different patches)

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  -e VERBOSE=true \
  -e FONOSTER_VERSION=0.3.3 \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/update.sh" \
  fonoster/fonoster:0.3.12
```

#### Stop (Happy path)

Stop your current installation.

```bash
docker run -it --rm \
  -e CONFIG_PATH=$(pwd)/fonoster/config \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume $(pwd)/fonoster:/out:rw \
  --entrypoint="/stop.sh" \
  fonoster/fonoster:0.3.12
```