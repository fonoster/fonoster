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
@fonos/ctl/0.0.1 darwin-x64 node-v10.19.0
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
* [`fonos apps:deploy`](#fonos-appsdeploy)
* [`fonos apps:get [NAME]`](#fonos-appsget-name)
* [`fonos apps:init`](#fonos-appsinit)
* [`fonos apps:list`](#fonos-appslist)
* [`fonos domains:create`](#fonos-domainscreate)
* [`fonos domains:delete [REF]`](#fonos-domainsdelete-ref)
* [`fonos domains:get [REF]`](#fonos-domainsget-ref)
* [`fonos domains:list`](#fonos-domainslist)
* [`fonos domains:update [REF]`](#fonos-domainsupdate-ref)
* [`fonos help [COMMAND]`](#fonos-help-command)
* [`fonos login`](#fonos-login)
* [`fonos logout`](#fonos-logout)
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

_See code: [src/commands/agents/create.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/agents/create.js)_

## `fonos agents:delete [REF]`

remove agent from a Fonos deployment

```
USAGE
  $ fonos agents:delete [REF]

ALIASES
  $ fonos agents:del
  $ fonos agents:rm
```

_See code: [src/commands/agents/delete.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/agents/delete.js)_

## `fonos agents:get [REF]`

get information about an existing agent

```
USAGE
  $ fonos agents:get [REF]
```

_See code: [src/commands/agents/get.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/agents/get.js)_

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

_See code: [src/commands/agents/list.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/agents/list.js)_

## `fonos agents:update [REF]`

updates a agent at the SIP Proxy subsystem

```
USAGE
  $ fonos agents:update [REF]

DESCRIPTION
  ...
  Updates a agent at the SIP Proxy subsystem
```

_See code: [src/commands/agents/update.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/agents/update.js)_

## `fonos apps:delete [NAME]`

removes application

```
USAGE
  $ fonos apps:delete [NAME]

ALIASES
  $ fonos apps:del
  $ fonos apps:rm
```

_See code: [src/commands/apps/delete.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/apps/delete.js)_

## `fonos apps:deploy`

deploys application to a Fonos instance

```
USAGE
  $ fonos apps:deploy

DESCRIPTION
  ...
  Run this command from the app root to deploy to Fonos.
```

_See code: [src/commands/apps/deploy.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/apps/deploy.js)_

## `fonos apps:get [NAME]`

get information about an existing application

```
USAGE
  $ fonos apps:get [NAME]

DESCRIPTION
  ...
  Obtain information about an application
```

_See code: [src/commands/apps/get.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/apps/get.js)_

## `fonos apps:init`

creates a new empty application

```
USAGE
  $ fonos apps:init

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/apps/init.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/apps/init.js)_

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

_See code: [src/commands/apps/list.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/apps/list.js)_

## `fonos domains:create`

creates a new domain resource

```
USAGE
  $ fonos domains:create

DESCRIPTION
  ...
  Creates a new Domain in the SIP Proxy subsystem
```

_See code: [src/commands/domains/create.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/domains/create.js)_

## `fonos domains:delete [REF]`

remove domain from a Fonos deployment

```
USAGE
  $ fonos domains:delete [REF]

ALIASES
  $ fonos domains:del
  $ fonos domains:rm
```

_See code: [src/commands/domains/delete.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/domains/delete.js)_

## `fonos domains:get [REF]`

get information about an existing domain

```
USAGE
  $ fonos domains:get [REF]
```

_See code: [src/commands/domains/get.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/domains/get.js)_

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

_See code: [src/commands/domains/list.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/domains/list.js)_

## `fonos domains:update [REF]`

updates a domain at the SIP Proxy subsystem

```
USAGE
  $ fonos domains:update [REF]

DESCRIPTION
  ...
  Updates a domain at the SIP Proxy subsystem
```

_See code: [src/commands/domains/update.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/domains/update.js)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `fonos login`

authenticates current station

```
USAGE
  $ fonos login

OPTIONS
  -f, --file=file  json file with access credentials
```

_See code: [src/commands/login.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/login.js)_

## `fonos logout`

revoke crendentials to current station

```
USAGE
  $ fonos logout
```

_See code: [src/commands/logout.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/logout.js)_

## `fonos numbers:create`

creates a new number resource

```
USAGE
  $ fonos numbers:create

DESCRIPTION
  ...
  Creates a new Number in the SIP Proxy subsystem
```

_See code: [src/commands/numbers/create.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/numbers/create.js)_

## `fonos numbers:delete [REF]`

remove number from a Fonos deployment

```
USAGE
  $ fonos numbers:delete [REF]

ALIASES
  $ fonos numbers:del
  $ fonos numbers:rm
```

_See code: [src/commands/numbers/delete.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/numbers/delete.js)_

## `fonos numbers:get [REF]`

get information about an existing number

```
USAGE
  $ fonos numbers:get [REF]
```

_See code: [src/commands/numbers/get.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/numbers/get.js)_

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

_See code: [src/commands/numbers/list.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/numbers/list.js)_

## `fonos numbers:update [REF]`

updates a number at the SIP Proxy subsystem

```
USAGE
  $ fonos numbers:update [REF]

DESCRIPTION
  ...
  Updates a number at the SIP Proxy subsystem
```

_See code: [src/commands/numbers/update.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/numbers/update.js)_

## `fonos providers:create`

creates a new provider resource

```
USAGE
  $ fonos providers:create

DESCRIPTION
  ...
  Creates a new Provider in the SIP Proxy subsystem
```

_See code: [src/commands/providers/create.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/providers/create.js)_

## `fonos providers:delete [REF]`

remove provider from a Fonos deployment

```
USAGE
  $ fonos providers:delete [REF]

ALIASES
  $ fonos providers:del
  $ fonos providers:rm
```

_See code: [src/commands/providers/delete.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/providers/delete.js)_

## `fonos providers:get [REF]`

get information about an existing provider

```
USAGE
  $ fonos providers:get [REF]
```

_See code: [src/commands/providers/get.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/providers/get.js)_

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

_See code: [src/commands/providers/list.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/providers/list.js)_

## `fonos providers:update [REF]`

updates a provider at the SIP Proxy subsystem

```
USAGE
  $ fonos providers:update [REF]

DESCRIPTION
  ...
  Updates a provider at the SIP Proxy subsystem
```

_See code: [src/commands/providers/update.js](https://github.com/fonoster/fonos/blob/v0.0.1/src/commands/providers/update.js)_
<!-- commandsstop -->
