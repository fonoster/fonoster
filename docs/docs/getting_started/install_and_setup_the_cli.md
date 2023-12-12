# Install and setup the CLI

Fonoster's command-line tool will help you manage your Fonoster instances. From creating `Agents` to deploying `Functions` and more.

## Installing

The command-line tool is available via NPM. Use the following steps to install the tool as a global command.

```none
1. Open a new terminal
2. Type "npm -g install @fonoster/ctl"
3. Wait for the process to complete
```

<video width="100%" playsInline="" controls="muted">
 <source src="/videos/install_and_setup_the_cli_1.mov" type="video/mp4" playsInline="" />
</video>

## Commands and subcommands

The command-line tool comes with built-in commands covering all main use cases and additional commands via plugins. Most commands are "collapsed" under a section. For example, the `agents` sections contain the following commands:

- `agents:create`  creates a new Agent resource
- `agents:delete`  removes an Agent from a Project
- `agents:get`     get information about an existing Agent
- `agents:list`    list registered Agents
- `agents:update`  updates an Agent at the SIP Proxy subsystem

## Authenticating the CLI

You can point the CLI to your own Fonoster instance or use our [as a service](https://console.fonoster.io) option. To use the as-a-service option, follow the next steps:

```none
1. Go to https://console.fonoster.io/ to get your credentials
2. Open a new terminal
3. Type the command "fonoster auth:login"
4. Login using your credentials
```

<video width="100%" playsInline="" controls="muted">
 <source src="/videos/install_and_setup_the_cli_2.mov" type="video/mp4" playsInline="" />
</video>


For detailed information about Fonoster's command-line interface, please visit the [NPM](https://www.npmjs.com/package/@fonoster/ctl) page.
