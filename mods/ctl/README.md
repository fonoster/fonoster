# ctl

Command-Line for for Fonos

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ctl.svg)](https://npmjs.org/package/ctl)
[![Downloads/week](https://img.shields.io/npm/dw/ctl.svg)](https://npmjs.org/package/ctl)
[![License](https://img.shields.io/npm/l/ctl.svg)](https://github.com/fonoster/fonoster/blob/master/package.json)

<!-- toc -->
* [ctl](#ctl)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @fonoster/ctl
$ fonoster COMMAND
running command...
$ fonoster (-v|--version|version)
@fonoster/ctl/0.2.11 darwin-x64 node-v14.16.0
$ fonoster --help [COMMAND]
USAGE
  $ fonoster COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`fonos agents:create`](#fonoster-agentscreate)
* [`fonos agents:delete [REF]`](#fonoster-agentsdelete-ref)
* [`fonos agents:get [REF]`](#fonoster-agentsget-ref)
* [`fonos agents:list`](#fonoster-agentslist)
* [`fonos agents:update [REF]`](#fonoster-agentsupdate-ref)
* [`fonos auth:login`](#fonoster-authlogin)
* [`fonos auth:logout`](#fonoster-authlogout)
* [`fonos bug`](#fonoster-bug)
* [`fonos domains:create`](#fonoster-domainscreate)
* [`fonos domains:delete [REF]`](#fonoster-domainsdelete-ref)
* [`fonos domains:get [REF]`](#fonoster-domainsget-ref)
* [`fonos domains:list`](#fonoster-domainslist)
* [`fonos domains:update [REF]`](#fonoster-domainsupdate-ref)
* [`fonos feedback`](#fonoster-feedback)
* [`fonos help [COMMAND]`](#fonoster-help-command)
* [`fonos numbers:create`](#fonoster-numberscreate)
* [`fonos numbers:delete [REF]`](#fonoster-numbersdelete-ref)
* [`fonos numbers:get [REF]`](#fonoster-numbersget-ref)
* [`fonos numbers:list`](#fonoster-numberslist)
* [`fonos numbers:update [REF]`](#fonoster-numbersupdate-ref)
* [`fonos plugins`](#fonoster-plugins)
* [`fonos plugins:inspect PLUGIN...`](#fonoster-pluginsinspect-plugin)
* [`fonos plugins:install PLUGIN...`](#fonoster-pluginsinstall-plugin)
* [`fonos plugins:link PLUGIN`](#fonoster-pluginslink-plugin)
* [`fonos plugins:uninstall PLUGIN...`](#fonoster-pluginsuninstall-plugin)
* [`fonos plugins:update`](#fonoster-pluginsupdate)
* [`fonos providers:create`](#fonoster-providerscreate)
* [`fonos providers:delete [REF]`](#fonoster-providersdelete-ref)
* [`fonos providers:get [REF]`](#fonoster-providersget-ref)
* [`fonos providers:list`](#fonoster-providerslist)
* [`fonos providers:update [REF]`](#fonoster-providersupdate-ref)

## `fonos agents:create`

creates a new agent resource

```
USAGE
  $ fonoster agents:create

DESCRIPTION
  ...
     Creates a new Agent in the SIP Proxy subsystem
```

_See code: [dist/commands/agents/create.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/agents/create.js)_

## `fonos agents:delete [REF]`

remove agent from a Fonos deployment

```
USAGE
  $ fonoster agents:delete [REF]

ALIASES
  $ fonoster agents:del
  $ fonoster agents:rm
```

_See code: [dist/commands/agents/delete.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/agents/delete.js)_

## `fonos agents:get [REF]`

get information about an existing agent

```
USAGE
  $ fonoster agents:get [REF]
```

_See code: [dist/commands/agents/get.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/agents/get.js)_

## `fonos agents:list`

list registered agents

```
USAGE
  $ fonoster agents:list

OPTIONS
  -s, --size=size  [default: 25] agent of result per page

DESCRIPTION
  ...
     List the registered agents

ALIASES
  $ fonoster agents:ls
```

_See code: [dist/commands/agents/list.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/agents/list.js)_

## `fonos agents:update [REF]`

updates a agent at the SIP Proxy subsystem

```
USAGE
  $ fonoster agents:update [REF]

DESCRIPTION
  ...
     Updates a agent at the SIP Proxy subsystem
```

_See code: [dist/commands/agents/update.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/agents/update.js)_

## `fonos auth:login`

log in to a fonoster deployment

```
USAGE
  $ fonoster auth:login
```

_See code: [dist/commands/auth/login.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/auth/login.js)_

## `fonos auth:logout`

log out from a fonoster deployment

```
USAGE
  $ fonoster auth:logout
```

_See code: [dist/commands/auth/logout.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/auth/logout.js)_

## `fonos bug`

start a bug report 🐞

```
USAGE
  $ fonoster bug

DESCRIPTION
  ...
     Opens github issues with a predefine bug template
```

_See code: [dist/commands/bug.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/bug.js)_

## `fonos domains:create`

creates a new domain resource

```
USAGE
  $ fonoster domains:create

DESCRIPTION
  ...
     Creates a new Domain in the SIP Proxy subsystem
```

_See code: [dist/commands/domains/create.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/domains/create.js)_

## `fonos domains:delete [REF]`

remove a domain from a Fonos deployment

```
USAGE
  $ fonoster domains:delete [REF]

ALIASES
  $ fonoster domains:del
  $ fonoster domains:rm
```

_See code: [dist/commands/domains/delete.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/domains/delete.js)_

## `fonos domains:get [REF]`

get information about an existing domain

```
USAGE
  $ fonoster domains:get [REF]
```

_See code: [dist/commands/domains/get.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/domains/get.js)_

## `fonos domains:list`

list registered domains

```
USAGE
  $ fonoster domains:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List the registered domains

ALIASES
  $ fonoster domains:ls
```

_See code: [dist/commands/domains/list.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/domains/list.js)_

## `fonos domains:update [REF]`

updates a domain at the SIP Proxy subsystem

```
USAGE
  $ fonoster domains:update [REF]

DESCRIPTION
  ...
     Updates a domain at the SIP Proxy subsystem
```

_See code: [dist/commands/domains/update.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/domains/update.js)_

## `fonos feedback`

let'us know how we're doing

```
USAGE
  $ fonoster feedback

DESCRIPTION
  ...
     Help us improve by providing some feedback
```

_See code: [dist/commands/feedback.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/feedback.js)_

## `fonos help [COMMAND]`

display help for fonos

```
USAGE
  $ fonoster help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `fonos numbers:create`

creates a new number resource

```
USAGE
  $ fonoster numbers:create

DESCRIPTION
  ...
     Creates a new Number in the SIP Proxy subsystem
```

_See code: [dist/commands/numbers/create.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/numbers/create.js)_

## `fonos numbers:delete [REF]`

remove a number from a Fonos deployment

```
USAGE
  $ fonoster numbers:delete [REF]

ALIASES
  $ fonoster numbers:del
  $ fonoster numbers:rm
```

_See code: [dist/commands/numbers/delete.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/numbers/delete.js)_

## `fonos numbers:get [REF]`

get information about an existing number

```
USAGE
  $ fonoster numbers:get [REF]
```

_See code: [dist/commands/numbers/get.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/numbers/get.js)_

## `fonos numbers:list`

list registered numbers

```
USAGE
  $ fonoster numbers:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List the registered numbers

ALIASES
  $ fonoster numbers:ls
```

_See code: [dist/commands/numbers/list.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/numbers/list.js)_

## `fonos numbers:update [REF]`

updates a number at the SIP Proxy subsystem

```
USAGE
  $ fonoster numbers:update [REF]

DESCRIPTION
  ...
     Updates a number at the SIP Proxy subsystem
```

_See code: [dist/commands/numbers/update.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/numbers/update.js)_

## `fonos plugins`

list installed plugins

```
USAGE
  $ fonoster plugins

OPTIONS
  --core  show core plugins

EXAMPLE
  $ fonoster plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.10.1/src/commands/plugins/index.ts)_

## `fonos plugins:inspect PLUGIN...`

displays installation properties of a plugin

```
USAGE
  $ fonoster plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] plugin to inspect

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

EXAMPLE
  $ fonoster plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.10.1/src/commands/plugins/inspect.ts)_

## `fonos plugins:install PLUGIN...`

installs a plugin into the CLI

```
USAGE
  $ fonoster plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  plugin to install

OPTIONS
  -f, --force    yarn install with force flag
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command 
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in 
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ fonoster plugins:add

EXAMPLES
  $ fonoster plugins:install myplugin 
  $ fonoster plugins:install https://github.com/someuser/someplugin
  $ fonoster plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.10.1/src/commands/plugins/install.ts)_

## `fonos plugins:link PLUGIN`

links a plugin into the CLI for development

```
USAGE
  $ fonoster plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello' 
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLE
  $ fonoster plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.10.1/src/commands/plugins/link.ts)_

## `fonos plugins:uninstall PLUGIN...`

removes a plugin from the CLI

```
USAGE
  $ fonoster plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ fonoster plugins:unlink
  $ fonoster plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.10.1/src/commands/plugins/uninstall.ts)_

## `fonos plugins:update`

update installed plugins

```
USAGE
  $ fonoster plugins:update

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.10.1/src/commands/plugins/update.ts)_

## `fonos providers:create`

creates a new provider resource

```
USAGE
  $ fonoster providers:create

DESCRIPTION
  ...
     Creates a new Provider in the SIP Proxy subsystem
```

_See code: [dist/commands/providers/create.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/providers/create.js)_

## `fonos providers:delete [REF]`

removes a provider from a Fonos deployment

```
USAGE
  $ fonoster providers:delete [REF]

ALIASES
  $ fonoster providers:del
  $ fonoster providers:rm
```

_See code: [dist/commands/providers/delete.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/providers/delete.js)_

## `fonos providers:get [REF]`

get information about an existing provider

```
USAGE
  $ fonoster providers:get [REF]
```

_See code: [dist/commands/providers/get.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/providers/get.js)_

## `fonos providers:list`

list registered providers

```
USAGE
  $ fonoster providers:list

OPTIONS
  -s, --size=size  [default: 25] provider of result per page

DESCRIPTION
  ...
     List the registered providers

ALIASES
  $ fonoster providers:ls
```

_See code: [dist/commands/providers/list.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/providers/list.js)_

## `fonos providers:update [REF]`

updates a provider at the SIP Proxy subsystem

```
USAGE
  $ fonoster providers:update [REF]

DESCRIPTION
  ...
     Updates a provider at the SIP Proxy subsystem
```

_See code: [dist/commands/providers/update.js](https://github.com/fonoster/fonoster/blob/v0.2.11/dist/commands/providers/update.js)_
<!-- commandsstop -->
