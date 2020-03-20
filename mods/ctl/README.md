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
$ yctl COMMAND
running command...
$ yctl (-v|--version|version)
@yaps/ctl/0.1.0 darwin-x64 node-v10.19.0
$ yctl --help [COMMAND]
USAGE
  $ yctl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`yctl apps:delete [FILE_PATH]`](#yctl-appsdelete-file_path)
* [`yctl apps:deploy`](#yctl-appsdeploy)
* [`yctl apps:get [FILE_PATH]`](#yctl-appsget-file_path)
* [`yctl apps:init [FILE_PATH]`](#yctl-appsinit-file_path)
* [`yctl apps:list [FILE_PATH]`](#yctl-appslist-file_path)
* [`yctl help [COMMAND]`](#yctl-help-command)

## `yctl apps:delete [FILE_PATH]`

deletes an existing voice application

```
USAGE
  $ yctl apps:delete [FILE_PATH]

OPTIONS
  -f, --file=file  path to project

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/apps/delete.js](https://github.com/fonoster/yaps/blob/v0.1.0/src/commands/apps/delete.js)_

## `yctl apps:deploy`

deploys application to a YAPS instance

```
USAGE
  $ yctl apps:deploy

DESCRIPTION
  ...
  Run this command from the app project to deploy to YAPS.
```

_See code: [src/commands/apps/deploy.js](https://github.com/fonoster/yaps/blob/v0.1.0/src/commands/apps/deploy.js)_

## `yctl apps:get [FILE_PATH]`

get detail about an existing application

```
USAGE
  $ yctl apps:get [FILE_PATH]

OPTIONS
  -f, --file=file  path to project

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/apps/get.js](https://github.com/fonoster/yaps/blob/v0.1.0/src/commands/apps/get.js)_

## `yctl apps:init [FILE_PATH]`

creates a new empty application

```
USAGE
  $ yctl apps:init [FILE_PATH]

OPTIONS
  -f, --file=file  path to project

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/apps/init.js](https://github.com/fonoster/yaps/blob/v0.1.0/src/commands/apps/init.js)_

## `yctl apps:list [FILE_PATH]`

display all the registered applications

```
USAGE
  $ yctl apps:list [FILE_PATH]

OPTIONS
  -f, --file=file  path to project

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src/commands/apps/list.js](https://github.com/fonoster/yaps/blob/v0.1.0/src/commands/apps/list.js)_

## `yctl help [COMMAND]`

display help for yctl

```
USAGE
  $ yctl help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_
<!-- commandsstop -->
