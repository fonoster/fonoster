# Contributing Guide

* [New Contributor Guide](#contributing-guide)
  * [Ways to Contribute](#ways-to-contribute)
  * [Find an Issue](#find-an-issue)
  * [Ask for Help](#ask-for-help)
  * [Pull Request Lifecycle](#pull-request-lifecycle)
  * [Development Environment Setup](#development-environment-setup)
    * [Dev Container](#dev-container)
  * [Sign your Commits](#sign-your-commits)
  * [Pull Request Checklist](#pull-request-checklist)

Welcome! We are glad that you want to contribute to Fonoster! 💖

As you get started, you are in the best position to give us feedback on areas of our project that we need help with, including:

* Problems found during setting up a new developer environment
* Gaps in our Quickstart Guide or documentation
* Bugs in our automation scripts

If anything doesn't make sense or work when you run it, please open a bug report and let us know!

## Ways to Contribute

We welcome many different types of contributions, including:

* New features
* Builds, CI/CD
* Bug fixes
* Documentation
* Issue Triage
* Answering questions on Discord/GitHub Discussions
* Web development
* UI/UX
* Communications / Social Media / Blog Posts
* Release management

Not everything happens through a GitHub pull request. Please come to our [meetings](https://discord.gg/4QWgSz4hTC) or [contact us](https://discord.gg/4QWgSz4hTC) and let's discuss how we can work
together. 

### Come to Meetings

Everyone is welcome to come to any of our meetings. You don't need an invite to join us. We want you to join us, even if you don't have anything you wish to contribute. Just being there is enough!

You can learn more about our meetings [here](https://discord.gg/4QWgSz4hTC). You don't have to turn on your video. The first time you come, introducing yourself is more than enough.

Over time, we hope you feel comfortable voicing your opinions, giving feedback on others' ideas, and even sharing your ideas and experiences.

## Find an Issue

We have good first issues for new contributors, and help wanted issues suitable for any contributor. [good first issue](https://github.com/fonoster/fonoster/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) has extra information to help you make your first contribution. [help wanted](https://github.com/fonoster/fonoster/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) are issues suitable for someone who isn't a core maintainer and is good to move onto after your first pull request.

Sometimes, these labels will be fine. That's ok! There is likely still something for you to work on. If you want to contribute but you don't know where to start or can't find a suitable issue, you can reach out to us via  [Discord](https://discord.gg/4QWgSz4hTC) or [GitHub Discussions](https://github.com/fonoster/fonoster/discussions), and we will help you find something.

Once you see an issue you'd like to work on, please post a comment saying you want to work on it. Something like "I want to work on this" is fine.

## Ask for Help

The best way to reach us with a question when contributing is to ask on:

* The original GitHub issue
* The [Discord](https://discord.gg/4QWgSz4hTC) community
* Our [GitHub Discussions](https://github.com/fonoster/fonoster/discussions)

## Pull Request Lifecycle

Before you start, please ensure no one else is working on the same issue. If a related pull request exists, we would appreciate your help. If you don't get a response within a reasonable timeframe, you can proceed with your pull request.

After you've submitted your pull request, it enters the review stage. During this time, the project maintainers or contributors will examine your changes. They might request modifications, such as:

- Enhancements in your code
- Additional tests or updates to the documentation
- Changes in your implementation approach
- Dividing your pull request into smaller, more manageable parts

Depending on the project's roadmap and priorities, you might also be asked to:

- Delay the integration of your pull request to align with future releases
- Close your current pull request and, if needed, open a new one with revised changes

## Development Environment Setup

See our [Development environment setup](https://github.com/fonoster/fonoster/tree/main/docs/self-hosting) guide to get started locally.

### Dev Container

The repo ships a [dev container](https://containers.dev) (`.devcontainer/`) with Node 20, git, the GitHub CLI, `protoc`, the OpenSpec CLI, and Playwright Chromium. Open the repo in VS Code and choose **Reopen in Container**, start a GitHub Codespace, or use the CLI:

```bash
npx @devcontainers/cli up --workspace-folder .
npx @devcontainers/cli exec --workspace-folder . bash
```

On first start it runs `npm ci`, copies `.env.example.dev` to `.env` and `config/*.example.yaml` to `config/*.yaml` (only if they're missing), generates `.keys/`, and installs Chromium for Playwright.

The container holds the Node workspace and tooling only. Postgres, NATS, InfluxDB, Routr, RTPEngine, envoy and mailhog keep running on your host's Docker engine. The container talks to that engine through the mounted Docker socket, so from inside it you can run:

```bash
npm run start:services   # docker compose -f compose.yaml -f compose.dev.yaml up ...
```

The repo is mounted at the same path as on your host, so the bind mounts in the compose files (`./.keys`, `./etc`, `./config`) resolve correctly on the host's Docker engine. Those services publish their ports on the host. Inside the container, `postgres`, `nats`, `influxdb`, `routr`, `envoy` and `mailhog` resolve to the host, so the example configs work as they are. The apiserver's port 50051 is published on the host, which lets envoy reach it at `DOCKER_HOST_ADDRESS`. Ports 3030 (dashboard), 6006 (Storybook), 50061 (autopilot), 8449 (envoy) and 8025 (mailhog) are forwarded.

Notes:

- `node_modules` at the root lives in a Docker volume, so the Linux build never overwrites your host's install. Per-package `mods/*/node_modules` folders are still shared with the host checkout.
- Run the dev container from a regular clone, not a `git worktree`. In a worktree, `.git` points to a host path that doesn't exist inside the container, so git and the husky hooks fail.
- Running `npm ci` or `npm install` inside the container regenerates the committed Prisma client in `mods/identity/src/generated` for Linux. That adds a `libquery_engine-linux-*.so.node` file and rewrites paths in `index.js`, `edge.js` and `wasm.js`. Don't commit that diff. The same thing already happens on any host other than the one that last generated the client.

## Sign your Commits

### DCO

Licensing is important to open-source projects. It assures that the software will continue to be available based on the terms that the author(s) desired. We require that contributors sign off on commits submitted to our project's repositories. The [Developer Certificate of Origin (DCO)](https://probot.github.io/apps/dco/) is a way to certify that you wrote and have the right to contribute the code you are submitting to the project.

You sign off by adding the following to your commit messages. Your sign-off must match the git user and email associated with the commit.

```text
This is my commit message

Signed-off-by: Your Name <your.name@example.com>
```

Git has a `-s` command line option to do this automatically:

```text
git commit -s -m 'chore: this is my commit message'
```

You can amend your commit with the sign-off by running if you forgot to do this and have yet to push your changes to the remote repository. 

```text
git commit --amend -s
```

Please note that our commit messages use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Pull Request Checklist

When you submit your pull request or push new commits, our automated systems will run some checks on your new code. We require that your pull request passes these checks, but we also have more criteria than just that before we can accept and merge it. We recommend that you check the following things locally before you submit your code:

- [ ] Your code builds and passes tests locally
- [ ] Your code passes our automated checks
- [ ] You have signed your commits
- [ ] You have added tests for your code (if applicable)
- [ ] You have updated the documentation (if applicable)
