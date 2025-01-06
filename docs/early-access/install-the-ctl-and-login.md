# Install the ctl and Login

Fonoster CTL is a command-line tool that allows you to manage your Fonoster resources. You can use it to create, update, and delete Fonoster resources like phone numbers, SIP trunks, and more.

In this guide, you'll learn how to install the command-line tool, and log in to a workspace, and create a new application.

## Installation

To install the command-line tool, you need to have NPM installed on your machine. You can install the tool using the following command:

```bash
npm install -g @fonoster/ctl
```

Check that the installation was successful by running the following command:

```bash
fonoster --version
```

If the installation was successful, you should see the version number of the command-line tool that you installed.

## Log in to a Fonoster Workspace

Before you can use the command-line tool, you need to log in to a Workspace. You can do this by running the following command:

```bash
fonoster workspaces:login
```

This command will prompt you to enter your _AccessKeyId_ and _AccessKeySecret_. Once you have entered this information, you will be logged in to your Workspace.

## Create a new Application

To create a new Application, you can use the following command:

```bash
fonoster applications:create
```

You will be asked to enter the name of the Application, speech information, and other details. Once you have entered this information, the Application will be created. 

Please see the [Getting started with Fonoster Autopilot](./starting-with-autopilot.md) guide for more information on how to create and configure an AI agent and obtain the endpoint value for your application.

To confirm that the application was created successfully, you can run the following command:

```bash
fonoster applications:list
```

Your output should show the newly created Application. Here is an example of what the output might look like:

```bash
REF                                     NAME                          TYPE      ENDPOINT
3e61ecb7-a1b6-4a93-84c3-4f1979165bca    Enma at Bella Ristorante      EXTERNAL  2.tcp.ngrok.io:19301
c495ee94-b93e-4ad1-b8bb-716833914c57    Julian at Papaton             EXTERNAL  3.tcp.ngrok.io:59421
dbdb871b-e701-4080-b91b-d62b79b7050d    Peters AI Assistant           EXTERNAL  6.tcp.ngrok.io:49705
```
