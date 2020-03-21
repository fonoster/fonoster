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
@yaps/ctl/0.0.3 darwin-x64 node-v10.19.0
$ yaps --help [COMMAND]
USAGE
  $ yaps COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`yaps apps:delete [NAME]`](#yaps-appsdelete-name)
* [`yaps apps:deploy`](#yaps-appsdeploy)
* [`yaps apps:get [NAME]`](#yaps-appsget-name)
* [`yaps apps:init`](#yaps-appsinit)
* [`yaps apps:list`](#yaps-appslist)
* [`yaps help [COMMAND]`](#yaps-help-command)
* [`yaps login`](#yaps-login)
* [`yaps logout`](#yaps-logout)

## `yaps apps:delete [NAME]`

get information about an existing application

```
USAGE
  $ yaps apps:delete [NAME]

DESCRIPTION
  ...
  Obtain information about an application

ALIASES
  $ yaps apps:del
  $ yaps apps:rm
```

_See code: [src/commands/apps/delete.js](https://github.com/fonoster/yaps/blob/v0.0.3/src/commands/apps/delete.js)_

## `yaps apps:deploy`

deploys application to a YAPS instance

```
USAGE
  $ yaps apps:deploy

DESCRIPTION
  ...
  Run this command from the app root to deploy to YAPS.
```

_See code: [src/commands/apps/deploy.js](https://github.com/fonoster/yaps/blob/v0.0.3/src/commands/apps/deploy.js)_

## `yaps apps:get [NAME]`

get information about an existing application

```
USAGE
  $ yaps apps:get [NAME]

DESCRIPTION
  ...
  Obtain information about an application
```

_See code: [src/commands/apps/get.js](https://github.com/fonoster/yaps/blob/v0.0.3/src/commands/apps/get.js)_

## `yaps apps:init`

creates a new empty application

```
USAGE
  $ yaps apps:init

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/apps/init.js](https://github.com/fonoster/yaps/blob/v0.0.3/src/commands/apps/init.js)_

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

_See code: [src/commands/apps/list.js](https://github.com/fonoster/yaps/blob/v0.0.3/src/commands/apps/list.js)_

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

_See code: [src/commands/login.js](https://github.com/fonoster/yaps/blob/v0.0.3/src/commands/login.js)_

## `yaps logout`

revoke crendentials to current station

```
USAGE
  $ yaps logout
```

_See code: [src/commands/logout.js](https://github.com/fonoster/yaps/blob/v0.0.3/src/commands/logout.js)_
<!-- commandsstop -->
