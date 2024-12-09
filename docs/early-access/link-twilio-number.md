# Link a Twilio Number to a Fonoster Application

The Fonoster CTL is a command-line tool that allows you to manage your Fonoster resources. You can use it to create, update, and delete Fonoster resources like phone numbers, SIP trunks, and more.

In this guide, you'll learn how to use the Fonoster CTL to create a new application, link that application to a Twilio number, and get detailed information about the linked number.

## Installation

To install the Fonoster CTL, you need to have Node.js and npm installed on your machine. You can install the Fonoster CTL using npm:

```bash
npm install -g @fonoster/ctl@next
```

Check that the installation was successful by running the following command:

```bash
fonoster --version
```

If the installation was successful, you should see the version number of the Fonoster CTL that you installed.

## Logging in to a Fonoster Workspace

Before you can use the Fonoster CTL, you need to log in to a Fonoster workspace. You can do this by running the following command:

```bash
fonoster workspaces:login
```

This command will prompt you to enter your AccessKeyId and AccessKeySecret. Once you have entered this information, you will be logged in to your workspace.

## Create a new Application

To create a new application, you can use the following command:

```bash
fonoster applications:create
```

You will be asked to enter the name of the application, speech information, and other details. Once you have entered this information, the application will be created. 

Please see the [Getting started with Fonoster Autopilot](./starting-with-autopilot.md) guide for more information on how to create and configure an AI agent and obtain the endpoint value for your application.

To confirm that the application was created successfully, you can run the following command:

```bash
fonoster applications:list
```

Your output should show the newly created application. Here is an example of what the output might look like:

```bash
REF                                     NAME                          TYPE      ENDPOINT
3e61ecb7-a1b6-4a93-84c3-4f1979165bca    Emma at Bella Ristorante      EXTERNAL  2.tcp.ngrok.io:19301
c495ee94-b93e-4ad1-b8bb-716833914c57    Julian at Papaton             EXTERNAL  3.tcp.ngrok.io:59421
dbdb871b-e701-4080-b91b-d62b79b7050d    Peters AI Assistant           EXTERNAL  6.tcp.ngrok.io:49705
```

## Link an Application to a Twilio Number

To link an application to a Twilio number, you can use the following command:

```bash
fonoster numbers:linkTwilioNumber
```

You will be asked to enter a number already existing in your Twilio account and the application you want to link to that number. Once you have entered this information, the application will be linked to the Twilio number.

Example of linking a Twilio number to an application:

```bash
This utility will help you create an Application.
Press ^C at any time to quit.
✔ Number to link (E.164 format) +17853178070
✔ Friendly Name Peters AI
✔ Application Julian at Papaton
✔ Twilio Account SID ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
✔ Twilio Auth Token
? Ready? (Y/n)
```

To confirm that the application was linked successfully, you can run the following command:

```bash
fonoster numbers:list
```

Your output should show the newly linked Twilio number. Here is an example of what the output might look like:

```bash
REF                                     NAME                          TEL URL                
131ff7f4-8359-41a6-b701-02283ecdda9b    Emma at Bella Ristorante      tel:+19842051452 (US)
347b0fd8-97d6-4f3c-a923-a76ab5c7bf4f    Julian at Ridesgur            tel:+18456134823 (US)
f8c0c4e4-49f3-46ba-9cdb-982729cfc8b9    Peter's AI Assistant          tel:+18559473625 (US)
```

And to get detailed information about a specific number, you can run the following command:

```bash
fonoster numbers:get f8c0c4e4-49f3-46ba-9cdb-982729cfc8b9
```

Your output should show detailed information about the linked Twilio number. Here is an example of what the output might look like:

```bash
NUMBERS DETAILS
------------------
NAME:             Peter's AI Assistant
REF:              f8c0c4e4-49f3-46ba-9cdb-982729cfc8b9
TEL URL:          tel:+18559473625
APP:              Peters AI Assistant
APP REF:          dbdb871b-e701-4080-b91b-d62b79b7050d
CITY:             unknown
TRUNK NAME:       REDACTED
TRUNK REF:        REDACTED
COUNTRY ISO CODE: US
COUNTRY:          USA
CREATED:          2024-12-08 11:32:16
UPDATED:          2024-12-08 11:32:16
```
