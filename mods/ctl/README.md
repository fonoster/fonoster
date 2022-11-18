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
@fonoster/ctl/0.3.17 darwin-x64 node-v16.16.0
$ fonoster --help [COMMAND]
USAGE
  $ fonoster COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`fonoster agents:create`](#fonoster-agentscreate)
* [`fonoster agents:delete [REF]`](#fonoster-agentsdelete-ref)
* [`fonoster agents:get [REF]`](#fonoster-agentsget-ref)
* [`fonoster agents:list`](#fonoster-agentslist)
* [`fonoster agents:update [REF]`](#fonoster-agentsupdate-ref)
* [`fonoster apps:create`](#fonoster-appscreate)
* [`fonoster apps:delete [REF]`](#fonoster-appsdelete-ref)
* [`fonoster apps:list`](#fonoster-appslist)
* [`fonoster apps:update [REF]`](#fonoster-appsupdate-ref)
* [`fonoster auth:login`](#fonoster-authlogin)
* [`fonoster auth:logout`](#fonoster-authlogout)
* [`fonoster bug`](#fonoster-bug)
* [`fonoster domains:create`](#fonoster-domainscreate)
* [`fonoster domains:delete [REF]`](#fonoster-domainsdelete-ref)
* [`fonoster domains:get [REF]`](#fonoster-domainsget-ref)
* [`fonoster domains:list`](#fonoster-domainslist)
* [`fonoster domains:update [REF]`](#fonoster-domainsupdate-ref)
* [`fonoster feedback`](#fonoster-feedback)
* [`fonoster help [COMMAND]`](#fonoster-help-command)
* [`fonoster numbers:create`](#fonoster-numberscreate)
* [`fonoster numbers:delete [REF]`](#fonoster-numbersdelete-ref)
* [`fonoster numbers:get [REF]`](#fonoster-numbersget-ref)
* [`fonoster numbers:list`](#fonoster-numberslist)
* [`fonoster numbers:update [REF]`](#fonoster-numbersupdate-ref)
* [`fonoster plugins`](#fonoster-plugins)
* [`fonoster plugins:inspect PLUGIN...`](#fonoster-pluginsinspect-plugin)
* [`fonoster plugins:install PLUGIN...`](#fonoster-pluginsinstall-plugin)
* [`fonoster plugins:link PLUGIN`](#fonoster-pluginslink-plugin)
* [`fonoster plugins:uninstall PLUGIN...`](#fonoster-pluginsuninstall-plugin)
* [`fonoster plugins:update`](#fonoster-pluginsupdate)
* [`fonoster projects:create`](#fonoster-projectscreate)
* [`fonoster projects:delete [REF]`](#fonoster-projectsdelete-ref)
* [`fonoster projects:get [REF]`](#fonoster-projectsget-ref)
* [`fonoster projects:list`](#fonoster-projectslist)
* [`fonoster projects:renew [REF]`](#fonoster-projectsrenew-ref)
* [`fonoster projects:use [REF]`](#fonoster-projectsuse-ref)
* [`fonoster providers:create`](#fonoster-providerscreate)
* [`fonoster providers:delete [REF]`](#fonoster-providersdelete-ref)
* [`fonoster providers:get [REF]`](#fonoster-providersget-ref)
* [`fonoster providers:list`](#fonoster-providerslist)
* [`fonoster providers:update [REF]`](#fonoster-providersupdate-ref)
* [`fonoster secrets:create [NAME]`](#fonoster-secretscreate-name)
* [`fonoster secrets:delete [NAME]`](#fonoster-secretsdelete-name)
* [`fonoster secrets:list`](#fonoster-secretslist)

## `fonoster agents:create`

create a new Fonoster Agent

```
USAGE
  $ fonoster agents:create

DESCRIPTION
  ...
     Create a new Fonoster Agent
```

_See code: [dist/commands/agents/create.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/agents/create.js)_

## `fonoster agents:delete [REF]`

delete a Fonoster Agent

```
USAGE
  $ fonoster agents:delete [REF]

ALIASES
  $ fonoster agents:del
  $ fonoster agents:rm
```

_See code: [dist/commands/agents/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/agents/delete.js)_

## `fonoster agents:get [REF]`

get a Fonoster Agent

```
USAGE
  $ fonoster agents:get [REF]
```

_See code: [dist/commands/agents/get.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/agents/get.js)_

## `fonoster agents:list`

list all Fonoster Agents you have access to

```
USAGE
  $ fonoster agents:list

OPTIONS
  -s, --size=size  [default: 25] agent of result per page

DESCRIPTION
  ...
     List all Fonoster Agents you have access to

ALIASES
  $ fonoster agents:ls
```

_See code: [dist/commands/agents/list.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/agents/list.js)_

## `fonoster agents:update [REF]`

update a Fonoster Agent

```
USAGE
  $ fonoster agents:update [REF]

DESCRIPTION
  ...
     Update a Fonoster Agent
```

_See code: [dist/commands/agents/update.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/agents/update.js)_

## `fonoster apps:create`

create a new Fonoster App

```
USAGE
  $ fonoster apps:create

DESCRIPTION
  ...
     Create a new Fonoster App
```

_See code: [dist/commands/apps/create.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/apps/create.js)_

## `fonoster apps:delete [REF]`

delete a Fonoster Application

```
USAGE
  $ fonoster apps:delete [REF]

ALIASES
  $ fonoster apps:del
  $ fonoster apps:rm
```

_See code: [dist/commands/apps/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/apps/delete.js)_

## `fonoster apps:list`

list all Fonoster Apps you have access to

```
USAGE
  $ fonoster apps:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List all Fonoster Apps you have access to

ALIASES
  $ fonoster apps:ls
```

_See code: [dist/commands/apps/list.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/apps/list.js)_

## `fonoster apps:update [REF]`

update a new Fonoster App

```
USAGE
  $ fonoster apps:update [REF]

DESCRIPTION
  ...
     Update a new Fonoster App
```

_See code: [dist/commands/apps/update.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/apps/update.js)_

## `fonoster auth:login`

log in to a Fonoster deployment

```
USAGE
  $ fonoster auth:login
```

_See code: [dist/commands/auth/login.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/auth/login.js)_

## `fonoster auth:logout`

log out from a fonoster deployment

```
USAGE
  $ fonoster auth:logout
```

_See code: [dist/commands/auth/logout.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/auth/logout.js)_

## `fonoster bug`

start a bug report 🐞

```
USAGE
  $ fonoster bug

DESCRIPTION
  ...
     Opens github issues with a predefine bug template
```

_See code: [dist/commands/bug.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/bug.js)_

## `fonoster domains:create`

create a new Fonoster Domain

```
USAGE
  $ fonoster domains:create

DESCRIPTION
  ...
     Create a new Fonoster Domain
```

_See code: [dist/commands/domains/create.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/domains/create.js)_

## `fonoster domains:delete [REF]`

delete a Fonoster Domain

```
USAGE
  $ fonoster domains:delete [REF]

ALIASES
  $ fonoster domains:del
  $ fonoster domains:rm
```

_See code: [dist/commands/domains/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/domains/delete.js)_

## `fonoster domains:get [REF]`

get a Fonoster Domain

```
USAGE
  $ fonoster domains:get [REF]
```

_See code: [dist/commands/domains/get.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/domains/get.js)_

## `fonoster domains:list`

list all Fonoster Domains you have access to

```
USAGE
  $ fonoster domains:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List all Fonoster Domains you have access to

ALIASES
  $ fonoster domains:ls
```

_See code: [dist/commands/domains/list.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/domains/list.js)_

## `fonoster domains:update [REF]`

update a Fonoster Domain

```
USAGE
  $ fonoster domains:update [REF]

DESCRIPTION
  ...
     Update a Fonoster Domain
```

_See code: [dist/commands/domains/update.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/domains/update.js)_

## `fonoster feedback`

let us know how we're doing

```
USAGE
  $ fonoster feedback

DESCRIPTION
  ...
     Help us improve by providing some feedback
```

_See code: [dist/commands/feedback.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/feedback.js)_

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

## `fonoster numbers:create`

create a new Fonoster Number

```
USAGE
  $ fonoster numbers:create

DESCRIPTION
  ...
     Create a new Fonoster Number
```

_See code: [dist/commands/numbers/create.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/numbers/create.js)_

## `fonoster numbers:delete [REF]`

delete a Fonoster Number

```
USAGE
  $ fonoster numbers:delete [REF]

ALIASES
  $ fonoster numbers:del
  $ fonoster numbers:rm
```

_See code: [dist/commands/numbers/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/numbers/delete.js)_

## `fonoster numbers:get [REF]`

get a Fonoster Number

```
USAGE
  $ fonoster numbers:get [REF]
```

_See code: [dist/commands/numbers/get.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/numbers/get.js)_

## `fonoster numbers:list`

list all Fonoster Numbers you have access to

```
USAGE
  $ fonoster numbers:list

OPTIONS
  -s, --size=size  [default: 25] number of result per page

DESCRIPTION
  ...
     List all Fonoster Numbers you have access to

ALIASES
  $ fonoster numbers:ls
```

_See code: [dist/commands/numbers/list.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/numbers/list.js)_

## `fonoster numbers:update [REF]`

update a Fonoster Number

```
USAGE
  $ fonoster numbers:update [REF]

DESCRIPTION
  ...
     Update a Fonoster Number
```

_See code: [dist/commands/numbers/update.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/numbers/update.js)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.6/src/commands/plugins/index.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.6/src/commands/plugins/inspect.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.6/src/commands/plugins/install.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.6/src/commands/plugins/link.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.6/src/commands/plugins/uninstall.ts)_

## `fonoster plugins:update`

Update installed plugins.

```
USAGE
  $ fonoster plugins:update

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.6/src/commands/plugins/update.ts)_

## `fonoster projects:create`

create a new Fonoster Project

```
USAGE
  $ fonoster projects:create

DESCRIPTION
  ...
     Create a new Fonoster Project
```

_See code: [dist/commands/projects/create.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/projects/create.js)_

## `fonoster projects:delete [REF]`

delete a Fonoster Project

```
USAGE
  $ fonoster projects:delete [REF]

ALIASES
  $ fonoster projects:del
  $ fonoster projects:rm
```

_See code: [dist/commands/projects/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/projects/delete.js)_

## `fonoster projects:get [REF]`

get a Fonoster Project

```
USAGE
  $ fonoster projects:get [REF]
```

_See code: [dist/commands/projects/get.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/projects/get.js)_

## `fonoster projects:list`

list all Fonoster Projects you have access to

```
USAGE
  $ fonoster projects:list

DESCRIPTION
  ...
     List all Fonoster Projects you have access to

ALIASES
  $ fonoster projects:ls
```

_See code: [dist/commands/projects/list.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/projects/list.js)_

## `fonoster projects:renew [REF]`

renew the credentials of a Fonoster Project

```
USAGE
  $ fonoster projects:renew [REF]

DESCRIPTION
  ...
     Renew the credentials of a Fonoster Project
```

_See code: [dist/commands/projects/renew.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/projects/renew.js)_

## `fonoster projects:use [REF]`

set a default Fonoster Project

```
USAGE
  $ fonoster projects:use [REF]

DESCRIPTION
  ...
     Set a default Fonoster Project
```

_See code: [dist/commands/projects/use.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/projects/use.js)_

## `fonoster providers:create`

create a new Fonoster Provider (trunk)

```
USAGE
  $ fonoster providers:create

DESCRIPTION
  ...
     Create a new Fonoster Provider
```

_See code: [dist/commands/providers/create.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/providers/create.js)_

## `fonoster providers:delete [REF]`

delete a Fonoster Provider

```
USAGE
  $ fonoster providers:delete [REF]

ALIASES
  $ fonoster providers:del
  $ fonoster providers:rm
```

_See code: [dist/commands/providers/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/providers/delete.js)_

## `fonoster providers:get [REF]`

get a Fonoster Provider

```
USAGE
  $ fonoster providers:get [REF]
```

_See code: [dist/commands/providers/get.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/providers/get.js)_

## `fonoster providers:list`

list all Fonoster Providers you have access to

```
USAGE
  $ fonoster providers:list

OPTIONS
  -s, --size=size  [default: 25] provider of result per page

DESCRIPTION
  ...
     List all Fonoster Providers you have access to

ALIASES
  $ fonoster providers:ls
```

_See code: [dist/commands/providers/list.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/providers/list.js)_

## `fonoster providers:update [REF]`

update a Fonoster Provider

```
USAGE
  $ fonoster providers:update [REF]

DESCRIPTION
  ...
     Update a Fonoster Provider
```

_See code: [dist/commands/providers/update.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/providers/update.js)_

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

_See code: [dist/commands/secrets/create.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/secrets/create.js)_

## `fonoster secrets:delete [NAME]`

remove Fonoster secret

```
USAGE
  $ fonoster secrets:delete [NAME]

ALIASES
  $ fonoster secrets:del
  $ fonoster secrets:rm
```

_See code: [dist/commands/secrets/delete.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/secrets/delete.js)_

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

_See code: [dist/commands/secrets/list.js](https://github.com/fonoster/fonoster/blob/v0.3.17/dist/commands/secrets/list.js)_
<!-- commandsstop -->
