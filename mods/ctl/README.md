ctl
===

Command-Line for for Fonos

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ctl.svg)](https://npmjs.org/package/ctl)
[![Downloads/week](https://img.shields.io/npm/dw/ctl.svg)](https://npmjs.org/package/ctl)
[![License](https://img.shields.io/npm/l/ctl.svg)](https://github.com/fonoster/fonos/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @fonos/ctl
$ fonos COMMAND
running command...
$ fonos (-v|--version|version)
@fonos/ctl/0.0.73 darwin-x64 node-v12.18.3
$ fonos --help [COMMAND]
USAGE
  $ fonos COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`fonos agents:create`](#fonos-agentscreate)
* [`fonos agents:delete [REF]`](#fonos-agentsdelete-ref)
* [`fonos agents:get [REF]`](#fonos-agentsget-ref)
* [`fonos agents:list`](#fonos-agentslist)
* [`fonos agents:update [REF]`](#fonos-agentsupdate-ref)
* [`fonos apps:delete [NAME]`](#fonos-appsdelete-name)
* [`fonos apps:deploy [REF]`](#fonos-appsdeploy-ref)
* [`fonos apps:get [NAME]`](#fonos-appsget-name)
* [`fonos apps:init`](#fonos-appsinit)
* [`fonos apps:list`](#fonos-appslist)
* [`fonos auth:login`](#fonos-authlogin)
* [`fonos auth:logout`](#fonos-authlogout)
* [`fonos domains:create`](#fonos-domainscreate)
* [`fonos domains:delete [REF]`](#fonos-domainsdelete-ref)
* [`fonos domains:get [REF]`](#fonos-domainsget-ref)
* [`fonos domains:list`](#fonos-domainslist)
* [`fonos domains:update [REF]`](#fonos-domainsupdate-ref)
* [`fonos help [COMMAND]`](#fonos-help-command)
* [`fonos numbers:create`](#fonos-numberscreate)
* [`fonos numbers:delete [REF]`](#fonos-numbersdelete-ref)
* [`fonos numbers:get [REF]`](#fonos-numbersget-ref)
* [`fonos numbers:list`](#fonos-numberslist)
* [`fonos numbers:update [REF]`](#fonos-numbersupdate-ref)
* [`fonos providers:create`](#fonos-providerscreate)
* [`fonos providers:delete [REF]`](#fonos-providersdelete-ref)
* [`fonos providers:get [REF]`](#fonos-providersget-ref)
* [`fonos providers:list`](#fonos-providerslist)
* [`fonos providers:update [REF]`](#fonos-providersupdate-ref)

## `fonos agents:create`

creates a new agent resource

```
USAGE
  $ fonos agents:create

DESCRIPTION
  ...
     Creates a new Agent in the SIP Proxy subsystem
```

_See code: [dist/commands/agents/create.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/agents/create.ts)_

## `fonos agents:delete [REF]`

remove agent from a Fonos deployment

```
USAGE
  $ fonos agents:delete [REF]

ALIASES
  $ fonos agents:del
  $ fonos agents:rm
```

_See code: [dist/commands/agents/delete.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/agents/delete.ts)_

## `fonos agents:get [REF]`

get information about an existing agent

```
USAGE
  $ fonos agents:get [REF]
```

_See code: [dist/commands/agents/get.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/agents/get.ts)_

## `fonos agents:list`

list registered agents

```
USAGE
  $ fonos agents:list

OPTIONS
  -s, --size=size  [default: 25] agent of result per page

DESCRIPTION
  ...
     List the registered agents

ALIASES
  $ fonos agents:ls
```

_See code: [dist/commands/agents/list.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/agents/list.ts)_

## `fonos agents:update [REF]`

updates a agent at the SIP Proxy subsystem

```
USAGE
  $ fonos agents:update [REF]

DESCRIPTION
  ...
     Updates a agent at the SIP Proxy subsystem
```

_See code: [dist/commands/agents/update.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/agents/update.ts)_

## `fonos apps:delete [NAME]`

removes application

```
USAGE
  $ fonos apps:delete [NAME]

ALIASES
  $ fonos apps:del
  $ fonos apps:rm
```

_See code: [dist/commands/apps/delete.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/apps/delete.ts)_

## `fonos apps:deploy [REF]`

deploys application to a Fonos instance

```
USAGE
  $ fonos apps:deploy [REF]

DESCRIPTION
  ...
     Run this command from the app root to deploy to Fonos.
```

_See code: [dist/commands/apps/deploy.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/apps/deploy.ts)_

## `fonos apps:get [NAME]`

get information about an existing application

```
USAGE
  $ fonos apps:get [NAME]

DESCRIPTION
  ...
     Obtain information about an application
```

_See code: [dist/commands/apps/get.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/apps/get.ts)_

## `fonos apps:init`

creates a new empty application

```
USAGE
  $ fonos apps:init

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [dist/commands/apps/init.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/apps/init.ts)_

## `fonos apps:list`

list registered applications

```
USAGE
  $ fonos apps:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List the registered applications

ALIASES
  $ fonos apps:ls
```

_See code: [dist/commands/apps/list.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/apps/list.ts)_

## `fonos auth:login`

log in to a fonos deployment

```
USAGE
  $ fonos auth:login
```

_See code: [dist/commands/auth/login.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/auth/login.ts)_

## `fonos auth:logout`

log out from a fonos deployment

```
USAGE
  $ fonos auth:logout
```

_See code: [dist/commands/auth/logout.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/auth/logout.ts)_

## `fonos domains:create`

creates a new domain resource

```
USAGE
  $ fonos domains:create

DESCRIPTION
  ...
     Creates a new Domain in the SIP Proxy subsystem
```

_See code: [dist/commands/domains/create.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/domains/create.ts)_

## `fonos domains:delete [REF]`

remove a domain from a Fonos deployment

```
USAGE
  $ fonos domains:delete [REF]

ALIASES
  $ fonos domains:del
  $ fonos domains:rm
```

_See code: [dist/commands/domains/delete.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/domains/delete.ts)_

## `fonos domains:get [REF]`

get information about an existing domain

```
USAGE
  $ fonos domains:get [REF]
```

_See code: [dist/commands/domains/get.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/domains/get.ts)_

## `fonos domains:list`

list registered domains

```
USAGE
  $ fonos domains:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List the registered domains

ALIASES
  $ fonos domains:ls
```

_See code: [dist/commands/domains/list.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/domains/list.ts)_

## `fonos domains:update [REF]`

updates a domain at the SIP Proxy subsystem

```
USAGE
  $ fonos domains:update [REF]

DESCRIPTION
  ...
     Updates a domain at the SIP Proxy subsystem
```

_See code: [dist/commands/domains/update.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/domains/update.ts)_

## `fonos help [COMMAND]`

display help for fonos

```
USAGE
  $ fonos help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `fonos numbers:create`

creates a new number resource

```
USAGE
  $ fonos numbers:create

DESCRIPTION
  ...
     Creates a new Number in the SIP Proxy subsystem
```

_See code: [dist/commands/numbers/create.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/numbers/create.ts)_

## `fonos numbers:delete [REF]`

remove a number from a Fonos deployment

```
USAGE
  $ fonos numbers:delete [REF]

ALIASES
  $ fonos numbers:del
  $ fonos numbers:rm
```

_See code: [dist/commands/numbers/delete.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/numbers/delete.ts)_

## `fonos numbers:get [REF]`

get information about an existing number

```
USAGE
  $ fonos numbers:get [REF]
```

_See code: [dist/commands/numbers/get.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/numbers/get.ts)_

## `fonos numbers:list`

list registered numbers

```
USAGE
  $ fonos numbers:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List the registered numbers

ALIASES
  $ fonos numbers:ls
```

_See code: [dist/commands/numbers/list.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/numbers/list.ts)_

## `fonos numbers:update [REF]`

updates a number at the SIP Proxy subsystem

```
USAGE
  $ fonos numbers:update [REF]

DESCRIPTION
  ...
     Updates a number at the SIP Proxy subsystem
```

_See code: [dist/commands/numbers/update.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/numbers/update.ts)_

## `fonos providers:create`

creates a new provider resource

```
USAGE
  $ fonos providers:create

DESCRIPTION
  ...
     Creates a new Provider in the SIP Proxy subsystem
```

_See code: [dist/commands/providers/create.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/providers/create.ts)_

## `fonos providers:delete [REF]`

removes a provider from a Fonos deployment

```
USAGE
  $ fonos providers:delete [REF]

ALIASES
  $ fonos providers:del
  $ fonos providers:rm
```

_See code: [dist/commands/providers/delete.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/providers/delete.ts)_

## `fonos providers:get [REF]`

get information about an existing provider

```
USAGE
  $ fonos providers:get [REF]
```

_See code: [dist/commands/providers/get.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/providers/get.ts)_

## `fonos providers:list`

list registered providers

```
USAGE
  $ fonos providers:list

OPTIONS
  -s, --size=size  [default: 25] provider of result per page

DESCRIPTION
  ...
     List the registered providers

ALIASES
  $ fonos providers:ls
```

_See code: [dist/commands/providers/list.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/providers/list.ts)_

## `fonos providers:update [REF]`

updates a provider at the SIP Proxy subsystem

```
USAGE
  $ fonos providers:update [REF]

DESCRIPTION
  ...
     Updates a provider at the SIP Proxy subsystem
```

_See code: [dist/commands/providers/update.ts](https://github.com/fonoster/fonos/blob/v0.0.73/dist/commands/providers/update.ts)_
<!-- commandsstop -->
