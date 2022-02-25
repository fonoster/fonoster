# ctl

Command-Line for for Fonoster

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
@fonoster/ctl/0.3.6-alpha.1 darwin-x64 node-v14.16.0
$ fonoster --help [COMMAND]
USAGE
  $ fonoster COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`fonoster auth:logout`](#fonoster-authlogout)
* [`fonoster bug`](#fonoster-bug)
* [`fonoster feedback`](#fonoster-feedback)
* [`fonoster help [COMMAND]`](#fonoster-help-command)
* [`fonoster plugins`](#fonoster-plugins)
* [`fonoster plugins:inspect PLUGIN...`](#fonoster-pluginsinspect-plugin)
* [`fonoster plugins:install PLUGIN...`](#fonoster-pluginsinstall-plugin)
* [`fonoster plugins:link PLUGIN`](#fonoster-pluginslink-plugin)
* [`fonoster plugins:uninstall PLUGIN...`](#fonoster-pluginsuninstall-plugin)
* [`fonoster plugins:update`](#fonoster-pluginsupdate)
* [`fonoster secrets:create [NAME]`](#fonoster-secretscreate-name)
* [`fonoster secrets:delete [NAME]`](#fonoster-secretsdelete-name)
* [`fonoster secrets:list`](#fonoster-secretslist)

## `fonoster auth:logout`

log out from a fonoster deployment

```
USAGE
  $ fonoster auth:logout
```

_See code: [dist/commands/auth/logout.js](https://github.com/fonoster/fonoster/blob/v0.3.6-alpha.1/dist/commands/auth/logout.js)_

## `fonoster bug`

start a bug report 🐞

```
USAGE
  $ fonoster bug

DESCRIPTION
  ...
     Opens github issues with a predefine bug template
```

_See code: [dist/commands/bug.js](https://github.com/fonoster/fonoster/blob/v0.3.6-alpha.1/dist/commands/bug.js)_

## `fonoster feedback`

let us know how we're doing

```
USAGE
  $ fonoster feedback

DESCRIPTION
  ...
     Help us improve by providing some feedback
```

_See code: [dist/commands/feedback.js](https://github.com/fonoster/fonoster/blob/v0.3.6-alpha.1/dist/commands/feedback.js)_

## `fonoster help [COMMAND]`

display help for fonoster

```
USAGE
  $ fonoster help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.3.1/src/commands/help.ts)_

## `fonoster plugins`

List installed plugins.

```
USAGE
  $ fonoster plugins

OPTIONS
  --core  Show core plugins.

EXAMPLE
  $ fonoster plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/index.ts)_

## `fonoster plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ fonoster plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose

EXAMPLE
  $ fonoster plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/inspect.ts)_

## `fonoster plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ fonoster plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

OPTIONS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/install.ts)_

## `fonoster plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ fonoster plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello' 
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLE
  $ fonoster plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/link.ts)_

## `fonoster plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ fonoster plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose

ALIASES
  $ fonoster plugins:unlink
  $ fonoster plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/uninstall.ts)_

## `fonoster plugins:update`

Update installed plugins.

```
USAGE
  $ fonoster plugins:update

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/update.ts)_

## `fonoster secrets:create [NAME]`

create a Fonoster secret.

```
USAGE
  $ fonoster secrets:create [NAME]

OPTIONS
  -h, --help                       show CLI help
  -l, --from-literal=from-literal  pass from literal
  -s, --from-stdin                 pass from stdin
```

_See code: [dist/commands/secrets/create.js](https://github.com/fonoster/fonoster/blob/v0.3.6-alpha.1/dist/commands/secrets/create.js)_

## `fonoster secrets:delete [NAME]`

remove Fonoster secret

```
USAGE
  $ fonoster secrets:delete [NAME]

ALIASES
  $ fonoster secrets:del
  $ fonoster secrets:rm
```

_See code: [dist/commands/secrets/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.6-alpha.1/dist/commands/secrets/delete.js)_

## `fonoster secrets:list`

list of the secrets you have access to

```
USAGE
  $ fonoster secrets:list

OPTIONS
  -s, --size=size  [default: 25] secrets of result per page

ALIASES
  $ fonoster secrets:ls
```

_See code: [dist/commands/secrets/list.js](https://github.com/fonoster/fonoster/blob/v0.3.6-alpha.1/dist/commands/secrets/list.js)_
<!-- commandsstop -->
