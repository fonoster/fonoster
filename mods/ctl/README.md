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
@fonoster/ctl/0.3.17-alpha.0 darwin-x64 node-v16.16.0
$ fonoster --help [COMMAND]
USAGE
  $ fonoster COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`fonoster help [COMMAND]`](#fonoster-help-command)
* [`fonoster plugins`](#fonoster-plugins)
* [`fonoster plugins:inspect PLUGIN...`](#fonoster-pluginsinspect-plugin)
* [`fonoster plugins:install PLUGIN...`](#fonoster-pluginsinstall-plugin)
* [`fonoster plugins:link PLUGIN`](#fonoster-pluginslink-plugin)
* [`fonoster plugins:uninstall PLUGIN...`](#fonoster-pluginsuninstall-plugin)
* [`fonoster plugins:update`](#fonoster-pluginsupdate)

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
<!-- commandsstop -->
