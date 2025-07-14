ctl
=================

Command-Line for Fonoster

[![command-line tool](https://img.shields.io/badge/ctl-oclif-brightgreen.svg)](https://fonoster.com)
[![Version](https://img.shields.io/npm/v/@fonoster/ctl.svg)](https://npmjs.org/package/@fonoster/voice)
[![Downloads/week](https://img.shields.io/npm/dw/@fonoster/ctl.svg)](https://npmjs.org/package/@fonoster/voice)
[![License](https://img.shields.io/npm/l/@fonoster/ctl.svg)](https://github.com/fonoster/fonoster/blob/main/package.json)

Use this tool to manage your Fonoster resources from the command line. With this tool, you can create, update, and delete resources like Applications, Numbers, SIP Agents, and more.

> When connecting to your own instance of Fonoster, remember to use your endpoint when login in. Also, remember to use the `--insecure` flag when connecting to a server with no TLS.

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @fonoster/ctl
$ fonoster COMMAND
running command...
$ fonoster (--version)
@fonoster/ctl/0.15.1 darwin-arm64 node-v22.14.0
$ fonoster --help [COMMAND]
USAGE
  $ fonoster COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`fonoster apikeys:create`](#fonoster-apikeyscreate)
* [`fonoster apikeys:delete REF`](#fonoster-apikeysdelete-ref)
* [`fonoster apikeys:list`](#fonoster-apikeyslist)
* [`fonoster apikeys:regenerate REF`](#fonoster-apikeysregenerate-ref)
* [`fonoster applications:create`](#fonoster-applicationscreate)
* [`fonoster applications:delete REF`](#fonoster-applicationsdelete-ref)
* [`fonoster applications:eval`](#fonoster-applicationseval)
* [`fonoster applications:get REF`](#fonoster-applicationsget-ref)
* [`fonoster applications:list`](#fonoster-applicationslist)
* [`fonoster applications:update REF`](#fonoster-applicationsupdate-ref)
* [`fonoster bug`](#fonoster-bug)
* [`fonoster feedback`](#fonoster-feedback)
* [`fonoster mcp:configure`](#fonoster-mcpconfigure)
* [`fonoster secrets:create`](#fonoster-secretscreate)
* [`fonoster secrets:delete REF`](#fonoster-secretsdelete-ref)
* [`fonoster secrets:get REF`](#fonoster-secretsget-ref)
* [`fonoster secrets:list`](#fonoster-secretslist)
* [`fonoster secrets:update REF`](#fonoster-secretsupdate-ref)
* [`fonoster sipnet:acls:create`](#fonoster-sipnetaclscreate)
* [`fonoster sipnet:acls:delete REF`](#fonoster-sipnetaclsdelete-ref)
* [`fonoster sipnet:acls:get REF`](#fonoster-sipnetaclsget-ref)
* [`fonoster sipnet:acls:list`](#fonoster-sipnetaclslist)
* [`fonoster sipnet:acls:update REF`](#fonoster-sipnetaclsupdate-ref)
* [`fonoster sipnet:agents:create`](#fonoster-sipnetagentscreate)
* [`fonoster sipnet:agents:delete REF`](#fonoster-sipnetagentsdelete-ref)
* [`fonoster sipnet:agents:get REF`](#fonoster-sipnetagentsget-ref)
* [`fonoster sipnet:agents:list`](#fonoster-sipnetagentslist)
* [`fonoster sipnet:agents:update REF`](#fonoster-sipnetagentsupdate-ref)
* [`fonoster sipnet:calls:create`](#fonoster-sipnetcallscreate)
* [`fonoster sipnet:calls:get REF`](#fonoster-sipnetcallsget-ref)
* [`fonoster sipnet:calls:list`](#fonoster-sipnetcallslist)
* [`fonoster sipnet:credentials:create`](#fonoster-sipnetcredentialscreate)
* [`fonoster sipnet:credentials:delete REF`](#fonoster-sipnetcredentialsdelete-ref)
* [`fonoster sipnet:credentials:get REF`](#fonoster-sipnetcredentialsget-ref)
* [`fonoster sipnet:credentials:list`](#fonoster-sipnetcredentialslist)
* [`fonoster sipnet:credentials:update REF`](#fonoster-sipnetcredentialsupdate-ref)
* [`fonoster sipnet:domains:create`](#fonoster-sipnetdomainscreate)
* [`fonoster sipnet:domains:delete REF`](#fonoster-sipnetdomainsdelete-ref)
* [`fonoster sipnet:domains:get REF`](#fonoster-sipnetdomainsget-ref)
* [`fonoster sipnet:domains:list`](#fonoster-sipnetdomainslist)
* [`fonoster sipnet:domains:update REF`](#fonoster-sipnetdomainsupdate-ref)
* [`fonoster sipnet:numbers:create`](#fonoster-sipnetnumberscreate)
* [`fonoster sipnet:numbers:delete REF`](#fonoster-sipnetnumbersdelete-ref)
* [`fonoster sipnet:numbers:get REF`](#fonoster-sipnetnumbersget-ref)
* [`fonoster sipnet:numbers:linkTwilioNumber`](#fonoster-sipnetnumberslinktwilionumber)
* [`fonoster sipnet:numbers:list`](#fonoster-sipnetnumberslist)
* [`fonoster sipnet:numbers:update REF`](#fonoster-sipnetnumbersupdate-ref)
* [`fonoster sipnet:trunks:create`](#fonoster-sipnettrunkscreate)
* [`fonoster sipnet:trunks:delete REF`](#fonoster-sipnettrunksdelete-ref)
* [`fonoster sipnet:trunks:get REF`](#fonoster-sipnettrunksget-ref)
* [`fonoster sipnet:trunks:list`](#fonoster-sipnettrunkslist)
* [`fonoster sipnet:trunks:update REF`](#fonoster-sipnettrunksupdate-ref)
* [`fonoster workspaces:active`](#fonoster-workspacesactive)
* [`fonoster workspaces:list`](#fonoster-workspaceslist)
* [`fonoster workspaces:login`](#fonoster-workspaceslogin)
* [`fonoster workspaces:logout REF`](#fonoster-workspaceslogout-ref)
* [`fonoster workspaces:use REF`](#fonoster-workspacesuse-ref)

## `fonoster apikeys:create`

create an API key for the active Workspace

```
USAGE
  $ fonoster apikeys:create [-i] [-e <value>] [-r <value>]

FLAGS
  -e, --expiration=<value>  API Key expiration time in days(e.g. 10d) or months(e.g. 10m)
  -i, --insecure            allow connections to a server with no TLS
  -r, --role=<value>        [default: WORKSPACE_ADMIN] API Key role

DESCRIPTION
  create an API key for the active Workspace

EXAMPLES
  $ fonoster apikeys:create
```

_See code: [dist/commands/apikeys/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/apikeys/create.js)_

## `fonoster apikeys:delete REF`

delete an API key from the active Workspace

```
USAGE
  $ fonoster apikeys:delete REF [-i]

ARGUMENTS
  REF  the ApiKey to delete from the Workspace

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  delete an API key from the active Workspace

EXAMPLES
  $ fonoster apikeys:delete
```

_See code: [dist/commands/apikeys/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/apikeys/delete.js)_

## `fonoster apikeys:list`

display all API keys in the active Workspace

```
USAGE
  $ fonoster apikeys:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all API keys in the active Workspace

EXAMPLES
  $ fonoster apikeys:list
```

_See code: [dist/commands/apikeys/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/apikeys/list.js)_

## `fonoster apikeys:regenerate REF`

generate a new access key secret for an API key

```
USAGE
  $ fonoster apikeys:regenerate REF [-i]

ARGUMENTS
  REF  the Application to update

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  generate a new access key secret for an API key

EXAMPLES
  $ fonoster apikeys:regenerate
```

_See code: [dist/commands/apikeys/regenerate.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/apikeys/regenerate.js)_

## `fonoster applications:create`

add a new Application to the active Workspace

```
USAGE
  $ fonoster applications:create [-i] [-f <value>]

FLAGS
  -f, --from-file=<value>  create Application from YAML or JSON file
  -i, --insecure           allow connections to a server with no TLS

DESCRIPTION
  add a new Application to the active Workspace

EXAMPLES
  $ fonoster applications:create
```

_See code: [dist/commands/applications/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/applications/create.js)_

## `fonoster applications:delete REF`

delete an Application from the active Workspace

```
USAGE
  $ fonoster applications:delete REF [-i]

ARGUMENTS
  REF  the Application to delete

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  delete an Application from the active Workspace

EXAMPLES
  $ fonoster applications:delete
```

_See code: [dist/commands/applications/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/applications/delete.js)_

## `fonoster applications:eval`

experimental command to test an Autopilot application

```
USAGE
  $ fonoster applications:eval -f <value> [-i]

FLAGS
  -f, --file=<value>  (required) path to test cases file (json, yaml, or yml)
  -i, --insecure      allow connections to a server with no TLS

DESCRIPTION
  experimental command to test an Autopilot application

EXAMPLES
  $ fonoster applications:eval -f assistant.json

  $ fonoster applications:eval -f assistant.yaml
```

_See code: [dist/commands/applications/eval.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/applications/eval.js)_

## `fonoster applications:get REF`

retrieve details of an Application by reference

```
USAGE
  $ fonoster applications:get REF [-i]

ARGUMENTS
  REF  The Application to show details about

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  retrieve details of an Application by reference

EXAMPLES
  $ fonoster applications:get
```

_See code: [dist/commands/applications/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/applications/get.js)_

## `fonoster applications:list`

display all Applications in the active Workspace

```
USAGE
  $ fonoster applications:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all Applications in the active Workspace

EXAMPLES
  $ fonoster applications:list
```

_See code: [dist/commands/applications/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/applications/list.js)_

## `fonoster applications:update REF`

modify the configuration of an Application

```
USAGE
  $ fonoster applications:update REF [-i] [-f <value>]

ARGUMENTS
  REF  the Application to update

FLAGS
  -f, --from-file=<value>  update Application from YAML or JSON file
  -i, --insecure           allow connections to a server with no TLS

DESCRIPTION
  modify the configuration of an Application

EXAMPLES
  $ fonoster applications:update
```

_See code: [dist/commands/applications/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/applications/update.js)_

## `fonoster bug`

report a bug to the development team 🐞

```
USAGE
  $ fonoster bug

DESCRIPTION
  report a bug to the development team 🐞

EXAMPLES
  $ fonoster bug
```

_See code: [dist/commands/bug.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/bug.js)_

## `fonoster feedback`

provide feedback on your experience

```
USAGE
  $ fonoster feedback

DESCRIPTION
  provide feedback on your experience
  ...
  Help us improve by providing some feedback


EXAMPLES
  $ fonoster feedback
```

_See code: [dist/commands/feedback.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/feedback.js)_

## `fonoster mcp:configure`

configure MCP client settings

```
USAGE
  $ fonoster mcp:configure [-c claude] [-w <value>]

FLAGS
  -c, --client=<option>    [default: claude] MCP client to configure
                           <options: claude>
  -w, --workspace=<value>  workspace reference

DESCRIPTION
  configure MCP client settings

EXAMPLES
  $ fonoster mcp:configure --client claude

  $ fonoster mcp:configure --client claude --workspace my-workspace
```

_See code: [dist/commands/mcp/configure.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/mcp/configure.js)_

## `fonoster secrets:create`

add a new Secret to the active Workspace

```
USAGE
  $ fonoster secrets:create [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  add a new Secret to the active Workspace

EXAMPLES
  $ fonoster secrets:create
```

_See code: [dist/commands/secrets/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/secrets/create.js)_

## `fonoster secrets:delete REF`

delete a Secret from the active Workspace

```
USAGE
  $ fonoster secrets:delete REF [-i]

ARGUMENTS
  REF  the Secret reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  delete a Secret from the active Workspace

EXAMPLES
  $ fonoster secrets:delete
```

_See code: [dist/commands/secrets/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/secrets/delete.js)_

## `fonoster secrets:get REF`

retrieve details of a Secret by reference

```
USAGE
  $ fonoster secrets:get REF [-i]

ARGUMENTS
  REF  The Secret to show details about

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  retrieve details of a Secret by reference

EXAMPLES
  $ fonoster secrets:get
```

_See code: [dist/commands/secrets/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/secrets/get.js)_

## `fonoster secrets:list`

display all Secrets in the active Workspace

```
USAGE
  $ fonoster secrets:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all Secrets in the active Workspace

EXAMPLES
  $ fonoster secrets:list
```

_See code: [dist/commands/secrets/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/secrets/list.js)_

## `fonoster secrets:update REF`

modify the value or metadata of a Secret

```
USAGE
  $ fonoster secrets:update REF [-i]

ARGUMENTS
  REF  the Secret to update

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  modify the value or metadata of a Secret

EXAMPLES
  $ fonoster secrets:update
```

_See code: [dist/commands/secrets/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/secrets/update.js)_

## `fonoster sipnet:acls:create`

create a new Access Control List (ACL)

```
USAGE
  $ fonoster sipnet:acls:create [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  create a new Access Control List (ACL)

EXAMPLES
  $ fonoster sipnet:acls:create
```

_See code: [dist/commands/sipnet/acls/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/acls/create.js)_

## `fonoster sipnet:acls:delete REF`

remove an Access Control List (ACL) from the Workspace

```
USAGE
  $ fonoster sipnet:acls:delete REF [-i]

ARGUMENTS
  REF  the ACL reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  remove an Access Control List (ACL) from the Workspace

EXAMPLES
  $ fonoster sipnet:acls:delete
```

_See code: [dist/commands/sipnet/acls/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/acls/delete.js)_

## `fonoster sipnet:acls:get REF`

get a specific Access Control List (ACL)

```
USAGE
  $ fonoster sipnet:acls:get REF [-i]

ARGUMENTS
  REF  The ACL reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  get a specific Access Control List (ACL)

EXAMPLES
  $ fonoster sipnet:acls:get
```

_See code: [dist/commands/sipnet/acls/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/acls/get.js)_

## `fonoster sipnet:acls:list`

list all Access Control Lists (ACLs)

```
USAGE
  $ fonoster sipnet:acls:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  list all Access Control Lists (ACLs)

EXAMPLES
  $ fonoster sipnet:acls:list
```

_See code: [dist/commands/sipnet/acls/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/acls/list.js)_

## `fonoster sipnet:acls:update REF`

update an existing Access Control List (ACL)

```
USAGE
  $ fonoster sipnet:acls:update REF [-i]

ARGUMENTS
  REF  the ACL reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  update an existing Access Control List (ACL)

EXAMPLES
  $ fonoster sipnet:acls:update
```

_See code: [dist/commands/sipnet/acls/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/acls/update.js)_

## `fonoster sipnet:agents:create`

add a new SIP Agent to the network

```
USAGE
  $ fonoster sipnet:agents:create [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  add a new SIP Agent to the network

EXAMPLES
  $ fonoster sipnet:agents:create
```

_See code: [dist/commands/sipnet/agents/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/agents/create.js)_

## `fonoster sipnet:agents:delete REF`

delete a SIP Agent from the network

```
USAGE
  $ fonoster sipnet:agents:delete REF [-i]

ARGUMENTS
  REF  the Agent reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  delete a SIP Agent from the network

EXAMPLES
  $ fonoster sipnet:agents:delete
```

_See code: [dist/commands/sipnet/agents/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/agents/delete.js)_

## `fonoster sipnet:agents:get REF`

retrieve details of a SIP Agent

```
USAGE
  $ fonoster sipnet:agents:get REF [-i]

ARGUMENTS
  REF  The Agent reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  retrieve details of a SIP Agent

EXAMPLES
  $ fonoster sipnet:agents:get
```

_See code: [dist/commands/sipnet/agents/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/agents/get.js)_

## `fonoster sipnet:agents:list`

display all SIP Agents in the network

```
USAGE
  $ fonoster sipnet:agents:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all SIP Agents in the network

EXAMPLES
  $ fonoster sipnet:agents:list
```

_See code: [dist/commands/sipnet/agents/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/agents/list.js)_

## `fonoster sipnet:agents:update REF`

add a new SIP Agent to the network

```
USAGE
  $ fonoster sipnet:agents:update REF [-i]

ARGUMENTS
  REF  the ACL reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  add a new SIP Agent to the network

EXAMPLES
  $ fonoster sipnet:agents:update
```

_See code: [dist/commands/sipnet/agents/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/agents/update.js)_

## `fonoster sipnet:calls:create`

initiate a call to a phone number or SIP URI

```
USAGE
  $ fonoster sipnet:calls:create -f <value> -t <value> -a <value> [-i] [-o <value>] [-c] [-m <value>]

FLAGS
  -a, --app-ref=<value>   (required) the reference to the application to use
  -c, --track-call        track the call
  -f, --from=<value>      (required) the number to make the call from
  -i, --insecure          allow connections to a server with no TLS
  -m, --metadata=<value>  a JSON object with metadata for the voice application (e.g. '{"name": "John Doe"}')
  -o, --timeout=<value>   [default: 30] the call timeout
  -t, --to=<value>        (required) the number to make the call to

DESCRIPTION
  initiate a call to a phone number or SIP URI

EXAMPLES
  $ fonoster sipnet:calls:create
```

_See code: [dist/commands/sipnet/calls/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/calls/create.js)_

## `fonoster sipnet:calls:get REF`

get a specific Access Control List (ACL)

```
USAGE
  $ fonoster sipnet:calls:get REF [-i]

ARGUMENTS
  REF  The ACL reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  get a specific Access Control List (ACL)

EXAMPLES
  $ fonoster sipnet:calls:get
```

_See code: [dist/commands/sipnet/calls/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/calls/get.js)_

## `fonoster sipnet:calls:list`

display all calls made in the active Workspace

```
USAGE
  $ fonoster sipnet:calls:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all calls made in the active Workspace

EXAMPLES
  $ fonoster sipnet:calls:list
```

_See code: [dist/commands/sipnet/calls/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/calls/list.js)_

## `fonoster sipnet:credentials:create`

add a new set of Credentials to the network

```
USAGE
  $ fonoster sipnet:credentials:create [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  add a new set of Credentials to the network

EXAMPLES
  $ fonoster sipnet:credentials:create
```

_See code: [dist/commands/sipnet/credentials/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/credentials/create.js)_

## `fonoster sipnet:credentials:delete REF`

delete a set of Credentials from the active Workspace

```
USAGE
  $ fonoster sipnet:credentials:delete REF [-i]

ARGUMENTS
  REF  the Credentials reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  delete a set of Credentials from the active Workspace

EXAMPLES
  $ fonoster sipnet:credentials:delete
```

_See code: [dist/commands/sipnet/credentials/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/credentials/delete.js)_

## `fonoster sipnet:credentials:get REF`

retrieve details of a set of Credentials by reference

```
USAGE
  $ fonoster sipnet:credentials:get REF [-i]

ARGUMENTS
  REF  The Credentials reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  retrieve details of a set of Credentials by reference

EXAMPLES
  $ fonoster sipnet:credentials:get
```

_See code: [dist/commands/sipnet/credentials/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/credentials/get.js)_

## `fonoster sipnet:credentials:list`

display all Credentials in the active Workspace

```
USAGE
  $ fonoster sipnet:credentials:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all Credentials in the active Workspace

EXAMPLES
  $ fonoster sipnet:credentials:list
```

_See code: [dist/commands/sipnet/credentials/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/credentials/list.js)_

## `fonoster sipnet:credentials:update REF`

modify the values or metadata of a set of Credentials

```
USAGE
  $ fonoster sipnet:credentials:update REF [-i]

ARGUMENTS
  REF  the Credentials reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  modify the values or metadata of a set of Credentials

EXAMPLES
  $ fonoster sipnet:credentials:update
```

_See code: [dist/commands/sipnet/credentials/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/credentials/update.js)_

## `fonoster sipnet:domains:create`

add a new Domain to the SIP network

```
USAGE
  $ fonoster sipnet:domains:create [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  add a new Domain to the SIP network

EXAMPLES
  $ fonoster sipnet:domains:create
```

_See code: [dist/commands/sipnet/domains/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/domains/create.js)_

## `fonoster sipnet:domains:delete REF`

delete a Domain from the active Workspace

```
USAGE
  $ fonoster sipnet:domains:delete REF [-i]

ARGUMENTS
  REF  the Domain reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  delete a Domain from the active Workspace

EXAMPLES
  $ fonoster sipnet:domains:delete
```

_See code: [dist/commands/sipnet/domains/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/domains/delete.js)_

## `fonoster sipnet:domains:get REF`

retrieve details of a Domain by reference

```
USAGE
  $ fonoster sipnet:domains:get REF [-i]

ARGUMENTS
  REF  The Domain reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  retrieve details of a Domain by reference

EXAMPLES
  $ fonoster sipnet:domains:get
```

_See code: [dist/commands/sipnet/domains/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/domains/get.js)_

## `fonoster sipnet:domains:list`

display all Domains in the SIP network

```
USAGE
  $ fonoster sipnet:domains:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all Domains in the SIP network

EXAMPLES
  $ fonoster sipnet:domains:list
```

_See code: [dist/commands/sipnet/domains/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/domains/list.js)_

## `fonoster sipnet:domains:update REF`

modify the configuration of a Domain

```
USAGE
  $ fonoster sipnet:domains:update REF [-i]

ARGUMENTS
  REF  the Domain reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  modify the configuration of a Domain

EXAMPLES
  $ fonoster sipnet:domains:update
```

_See code: [dist/commands/sipnet/domains/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/domains/update.js)_

## `fonoster sipnet:numbers:create`

add a new Number to the SIP network

```
USAGE
  $ fonoster sipnet:numbers:create [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  add a new Number to the SIP network

EXAMPLES
  $ fonoster sipnet:numbers:create
```

_See code: [dist/commands/sipnet/numbers/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/numbers/create.js)_

## `fonoster sipnet:numbers:delete REF`

delete a Number from the active Workspace

```
USAGE
  $ fonoster sipnet:numbers:delete REF [-i]

ARGUMENTS
  REF  the Numbers's reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  delete a Number from the active Workspace

EXAMPLES
  $ fonoster sipnet:numbers:delete
```

_See code: [dist/commands/sipnet/numbers/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/numbers/delete.js)_

## `fonoster sipnet:numbers:get REF`

retrieve details of a Number by reference

```
USAGE
  $ fonoster sipnet:numbers:get REF [-i]

ARGUMENTS
  REF  the Number to show details about

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  retrieve details of a Number by reference

EXAMPLES
  $ fonoster sipnet:numbers:get
```

_See code: [dist/commands/sipnet/numbers/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/numbers/get.js)_

## `fonoster sipnet:numbers:linkTwilioNumber`

associate a Twilio number with a Fonoster Application

```
USAGE
  $ fonoster sipnet:numbers:linkTwilioNumber [-i] [-b <value>] [-a <value>]

FLAGS
  -a, --access-control-list=<value>  [default: 165.22.7.155/32] the access control list to allow (use if running your
                                     Fonoster instance)
  -b, --outbound-uri-base=<value>    [default: pstn.fonoster.com] the uri to point twilio to for outbound calls (use if
                                     running your Fonoster instance)
  -i, --insecure                     allow connections to a server with no TLS

DESCRIPTION
  associate a Twilio number with a Fonoster Application

EXAMPLES
  $ fonoster sipnet:numbers:linkTwilioNumber
```

_See code: [dist/commands/sipnet/numbers/linkTwilioNumber.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/numbers/linkTwilioNumber.js)_

## `fonoster sipnet:numbers:list`

display all Numbers in the active Workspace

```
USAGE
  $ fonoster sipnet:numbers:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to return

DESCRIPTION
  display all Numbers in the active Workspace

EXAMPLES
  $ fonoster sipnet:numbers:list
```

_See code: [dist/commands/sipnet/numbers/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/numbers/list.js)_

## `fonoster sipnet:numbers:update REF`

modify the configuration of a Number

```
USAGE
  $ fonoster sipnet:numbers:update REF [-i]

ARGUMENTS
  REF  the Number to update

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  modify the configuration of a Number

EXAMPLES
  $ fonoster sipnet:numbers:update
```

_See code: [dist/commands/sipnet/numbers/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/numbers/update.js)_

## `fonoster sipnet:trunks:create`

add a new Trunk to the SIP network

```
USAGE
  $ fonoster sipnet:trunks:create [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  add a new Trunk to the SIP network

EXAMPLES
  $ fonoster sipnet:trunks:create
```

_See code: [dist/commands/sipnet/trunks/create.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/trunks/create.js)_

## `fonoster sipnet:trunks:delete REF`

remove a Trunk from the active Workspace

```
USAGE
  $ fonoster sipnet:trunks:delete REF [-i]

ARGUMENTS
  REF  the Trunk's reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  remove a Trunk from the active Workspace

EXAMPLES
  $ fonoster sipnet:trunks:delete
```

_See code: [dist/commands/sipnet/trunks/delete.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/trunks/delete.js)_

## `fonoster sipnet:trunks:get REF`

retrieve details of a Trunk by reference

```
USAGE
  $ fonoster sipnet:trunks:get REF [-i]

ARGUMENTS
  REF  The Trunk's reference

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  retrieve details of a Trunk by reference

EXAMPLES
  $ fonoster sipnet:trunks:get
```

_See code: [dist/commands/sipnet/trunks/get.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/trunks/get.js)_

## `fonoster sipnet:trunks:list`

display all Trunks in the active Workspace

```
USAGE
  $ fonoster sipnet:trunks:list [-i] [-s <value>]

FLAGS
  -i, --insecure           allow connections to a server with no TLS
  -s, --page-size=<value>  [default: 1000] the number of items to show

DESCRIPTION
  display all Trunks in the active Workspace

EXAMPLES
  $ fonoster sipnet:trunks:list
```

_See code: [dist/commands/sipnet/trunks/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/trunks/list.js)_

## `fonoster sipnet:trunks:update REF`

modify the configuration of a Trunk

```
USAGE
  $ fonoster sipnet:trunks:update REF [-i]

ARGUMENTS
  REF  the Trunk to update

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  modify the configuration of a Trunk

EXAMPLES
  $ fonoster sipnet:trunks:update
```

_See code: [dist/commands/sipnet/trunks/update.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/sipnet/trunks/update.js)_

## `fonoster workspaces:active`

display the name of the active Workspace

```
USAGE
  $ fonoster workspaces:active

DESCRIPTION
  display the name of the active Workspace

EXAMPLES
  $ fonoster workspaces:active
```

_See code: [dist/commands/workspaces/active.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/workspaces/active.js)_

## `fonoster workspaces:list`

display all linked Workspaces

```
USAGE
  $ fonoster workspaces:list

DESCRIPTION
  display all linked Workspaces

EXAMPLES
  $ fonoster workspaces:list
```

_See code: [dist/commands/workspaces/list.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/workspaces/list.js)_

## `fonoster workspaces:login`

link a Workspace to the local environment

```
USAGE
  $ fonoster workspaces:login [-i]

FLAGS
  -i, --insecure  allow connections to a server with no TLS

DESCRIPTION
  link a Workspace to the local environment

EXAMPLES
  $ fonoster workspaces:login
```

_See code: [dist/commands/workspaces/login.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/workspaces/login.js)_

## `fonoster workspaces:logout REF`

unlink a Workspace from the local environment

```
USAGE
  $ fonoster workspaces:logout REF

ARGUMENTS
  REF  the Workspace to unlink from

DESCRIPTION
  unlink a Workspace from the local environment

EXAMPLES
  $ fonoster workspaces:logout
```

_See code: [dist/commands/workspaces/logout.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/workspaces/logout.js)_

## `fonoster workspaces:use REF`

set a Workspace as the default

```
USAGE
  $ fonoster workspaces:use REF

ARGUMENTS
  REF  The Workspace to unlink from

DESCRIPTION
  set a Workspace as the default

EXAMPLES
  $ fonoster workspaces:use
```

_See code: [dist/commands/workspaces/use.js](https://github.com/fonoster/fonoster/blob/v0.15.1/dist/commands/workspaces/use.js)_
<!-- commandsstop -->
