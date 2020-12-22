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
@fonos/ctl/0.0.49 darwin-x64 node-v14.4.0
$ fonos --help [COMMAND]
USAGE
  $ fonos COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`fonos apps:init`](#fonos-appsinit)
* [`fonos config:destroy`](#fonos-configdestroy)
* [`fonos config:init`](#fonos-configinit)
* [`fonos help [COMMAND]`](#fonos-help-command)

## `fonos apps:init`

creates a new empty application

```
USAGE
  $ fonos apps:init

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [dist/commands/apps/init.ts](https://github.com/fonoster/fonos/blob/v0.0.49/dist/commands/apps/init.ts)_

## `fonos config:destroy`

revoke crendentials and removes certificates for current station

```
USAGE
  $ fonos config:destroy
```

_See code: [dist/commands/config/destroy.ts](https://github.com/fonoster/fonos/blob/v0.0.49/dist/commands/config/destroy.ts)_

## `fonos config:init`

authenticates current station

```
USAGE
  $ fonos config:init

OPTIONS
  -f, --file=file  json file with access credentials
  -s, --size=size  json file with access credentials
```

_See code: [dist/commands/config/init.ts](https://github.com/fonoster/fonos/blob/v0.0.49/dist/commands/config/init.ts)_

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
<!-- commandsstop -->
