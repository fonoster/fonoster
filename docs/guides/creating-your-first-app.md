## Prerequisites

- A running Fonos deployment
- [Fonos CTL](https://www.npmjs.com/package/@fonos/ctl)

## Create your Application

To create a new application, create a new folder with the application's name, and run the `apps:init` command. The command will prompt you with a few questions, and the ctl will create a new application.

```
? package name default
? version 1.0.0
? description My new Application
? entry point src/index.js
? bucket name default
? author John Doe
? license MIT
? locale en_US
? does everything look good? Yes
```

> When in doubt use the prompt's defaults

## Deploying the Application

To deploy your application, run the command `apps:deploy` from within your new applications' folder. The out will look like this:

```
fonos apps:deploy
Deploying application...
Name:           default
Description:    My new Application
Create:         Sat Aug 15 2020 03:11:29 GMT+0000 (Coordinated Universal Time)
Default Bucket: default
```

> Tip: Fonos will direct all inbound call to this application of no other is assigned to a given number

## Testing the new Application

The fastest way to test your new application is to connect directly to the MediaServer using the test account. The test account has the following credentials:

USENAME = 1001
PASSWORD = 1234
TEST EXTENSION = 1002

Once you configure your softphone, call the extension `1002` to interact with your new application.

> We don't recommend enabling direct access to the MediaServer or using the 1001@test in production