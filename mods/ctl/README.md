ctl
===

Command-Line for for YAPS

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ctl.svg)](https://npmjs.org/package/ctl)
[![Downloads/week](https://img.shields.io/npm/dw/ctl.svg)](https://npmjs.org/package/ctl)
[![License](https://img.shields.io/npm/l/ctl.svg)](https://github.com/fonoster/yaps/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @yaps/ctl
$ yaps COMMAND
running command...
$ yaps (-v|--version|version)
@yaps/ctl/0.0.5 darwin-x64 node-v10.19.0
$ yaps --help [COMMAND]
USAGE
  $ yaps COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`yaps agents:create`](#yaps-agentscreate)
* [`yaps agents:delete [REF]`](#yaps-agentsdelete-ref)
* [`yaps agents:get [REF]`](#yaps-agentsget-ref)
* [`yaps agents:list`](#yaps-agentslist)
* [`yaps agents:update [REF]`](#yaps-agentsupdate-ref)
* [`yaps apps:delete [NAME]`](#yaps-appsdelete-name)
* [`yaps apps:deploy`](#yaps-appsdeploy)
* [`yaps apps:get [NAME]`](#yaps-appsget-name)
* [`yaps apps:init`](#yaps-appsinit)
* [`yaps apps:list`](#yaps-appslist)
* [`yaps domains:create`](#yaps-domainscreate)
* [`yaps domains:delete [REF]`](#yaps-domainsdelete-ref)
* [`yaps domains:get [REF]`](#yaps-domainsget-ref)
* [`yaps domains:list`](#yaps-domainslist)
* [`yaps domains:update [REF]`](#yaps-domainsupdate-ref)
* [`yaps help [COMMAND]`](#yaps-help-command)
* [`yaps login`](#yaps-login)
* [`yaps logout`](#yaps-logout)
* [`yaps numbers:create`](#yaps-numberscreate)
* [`yaps numbers:delete [REF]`](#yaps-numbersdelete-ref)
* [`yaps numbers:get [REF]`](#yaps-numbersget-ref)
* [`yaps numbers:list`](#yaps-numberslist)
* [`yaps numbers:update [REF]`](#yaps-numbersupdate-ref)
* [`yaps providers:create`](#yaps-providerscreate)
* [`yaps providers:delete [REF]`](#yaps-providersdelete-ref)
* [`yaps providers:get [REF]`](#yaps-providersget-ref)
* [`yaps providers:list`](#yaps-providerslist)
* [`yaps providers:update [REF]`](#yaps-providersupdate-ref)

## `yaps agents:create`

creates a new agent resource

```
USAGE
  $ yaps agents:create

DESCRIPTION
  ...
  Creates a new Agent in the SIP Proxy subsystem
```

_See code: [src/commands/agents/create.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/agents/create.js)_

## `yaps agents:delete [REF]`

remove agent from a YAPS deployment

```
USAGE
  $ yaps agents:delete [REF]

ALIASES
  $ yaps agents:del
  $ yaps agents:rm
```

_See code: [src/commands/agents/delete.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/agents/delete.js)_

## `yaps agents:get [REF]`

get information about an existing agent

```
USAGE
  $ yaps agents:get [REF]
```

_See code: [src/commands/agents/get.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/agents/get.js)_

## `yaps agents:list`

list registered agents

```
USAGE
  $ yaps agents:list

OPTIONS
  -s, --size=size  [default: 25] agent of result per page

DESCRIPTION
  ...
  List the registered agents

ALIASES
  $ yaps agents:ls
```

_See code: [src/commands/agents/list.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/agents/list.js)_

## `yaps agents:update [REF]`

updates a agent at the SIP Proxy subsystem

```
USAGE
  $ yaps agents:update [REF]

DESCRIPTION
  ...
  Updates a agent at the SIP Proxy subsystem
```

_See code: [src/commands/agents/update.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/agents/update.js)_

## `yaps apps:delete [NAME]`

removes application

```
USAGE
  $ yaps apps:delete [NAME]

ALIASES
  $ yaps apps:del
  $ yaps apps:rm
```

_See code: [src/commands/apps/delete.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/apps/delete.js)_

## `yaps apps:deploy`

deploys application to a YAPS instance

```
USAGE
  $ yaps apps:deploy

DESCRIPTION
  ...
  Run this command from the app root to deploy to YAPS.
```

_See code: [src/commands/apps/deploy.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/apps/deploy.js)_

## `yaps apps:get [NAME]`

get information about an existing application

```
USAGE
  $ yaps apps:get [NAME]

DESCRIPTION
  ...
  Obtain information about an application
```

_See code: [src/commands/apps/get.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/apps/get.js)_

## `yaps apps:init`

creates a new empty application

```
USAGE
  $ yaps apps:init

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/apps/init.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/apps/init.js)_

## `yaps apps:list`

list registered applications

```
USAGE
  $ yaps apps:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
  List the registered applications

ALIASES
  $ yaps apps:ls
```

_See code: [src/commands/apps/list.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/apps/list.js)_

## `yaps domains:create`

creates a new domain resource

```
USAGE
  $ yaps domains:create

DESCRIPTION
  ...
  Creates a new Domain in the SIP Proxy subsystem
```

_See code: [src/commands/domains/create.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/domains/create.js)_

## `yaps domains:delete [REF]`

remove domain from a YAPS deployment

```
USAGE
  $ yaps domains:delete [REF]

ALIASES
  $ yaps domains:del
  $ yaps domains:rm
```

_See code: [src/commands/domains/delete.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/domains/delete.js)_

## `yaps domains:get [REF]`

get information about an existing domain

```
USAGE
  $ yaps domains:get [REF]
```

_See code: [src/commands/domains/get.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/domains/get.js)_

## `yaps domains:list`

list registered domains

```
USAGE
  $ yaps domains:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
  List the registered domains

ALIASES
  $ yaps domains:ls
```

_See code: [src/commands/domains/list.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/domains/list.js)_

## `yaps domains:update [REF]`

updates a domain at the SIP Proxy subsystem

```
USAGE
  $ yaps domains:update [REF]

DESCRIPTION
  ...
  Updates a domain at the SIP Proxy subsystem
```

_See code: [src/commands/domains/update.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/domains/update.js)_

## `yaps help [COMMAND]`

display help for yaps

```
USAGE
  $ yaps help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `yaps login`

authenticates current station

```
USAGE
  $ yaps login

OPTIONS
  -f, --file=file  json file with access credentials
```

_See code: [src/commands/login.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/login.js)_

## `yaps logout`

revoke crendentials to current station

```
USAGE
  $ yaps logout
```

_See code: [src/commands/logout.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/logout.js)_

## `yaps numbers:create`

creates a new number resource

```
USAGE
  $ yaps numbers:create

DESCRIPTION
  ...
  Creates a new Number in the SIP Proxy subsystem
```

_See code: [src/commands/numbers/create.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/numbers/create.js)_

## `yaps numbers:delete [REF]`

remove number from a YAPS deployment

```
USAGE
  $ yaps numbers:delete [REF]

ALIASES
  $ yaps numbers:del
  $ yaps numbers:rm
```

_See code: [src/commands/numbers/delete.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/numbers/delete.js)_

## `yaps numbers:get [REF]`

get information about an existing number

```
USAGE
  $ yaps numbers:get [REF]
```

_See code: [src/commands/numbers/get.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/numbers/get.js)_

## `yaps numbers:list`

list registered numbers

```
USAGE
  $ yaps numbers:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
  List the registered numbers

ALIASES
  $ yaps numbers:ls
```

_See code: [src/commands/numbers/list.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/numbers/list.js)_

## `yaps numbers:update [REF]`

updates a number at the SIP Proxy subsystem

```
USAGE
  $ yaps numbers:update [REF]

DESCRIPTION
  ...
  Updates a number at the SIP Proxy subsystem
```

_See code: [src/commands/numbers/update.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/numbers/update.js)_

## `yaps providers:create`

creates a new provider resource

```
USAGE
  $ yaps providers:create

DESCRIPTION
  ...
  Creates a new Provider in the SIP Proxy subsystem
```

_See code: [src/commands/providers/create.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/providers/create.js)_

## `yaps providers:delete [REF]`

remove provider from a YAPS deployment

```
USAGE
  $ yaps providers:delete [REF]

ALIASES
  $ yaps providers:del
  $ yaps providers:rm
```

_See code: [src/commands/providers/delete.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/providers/delete.js)_

## `yaps providers:get [REF]`

get information about an existing provider

```
USAGE
  $ yaps providers:get [REF]
```

_See code: [src/commands/providers/get.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/providers/get.js)_

## `yaps providers:list`

list registered providers

```
USAGE
  $ yaps providers:list

OPTIONS
  -s, --size=size  [default: 25] provider of result per page

DESCRIPTION
  ...
  List the registered providers

ALIASES
  $ yaps providers:ls
```

_See code: [src/commands/providers/list.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/providers/list.js)_

## `yaps providers:update [REF]`

updates a provider at the SIP Proxy subsystem

```
USAGE
  $ yaps providers:update [REF]

DESCRIPTION
  ...
  Updates a provider at the SIP Proxy subsystem
```

_See code: [src/commands/providers/update.js](https://github.com/fonoster/yaps/blob/v0.0.5/src/commands/providers/update.js)_
<!-- commandsstop -->
