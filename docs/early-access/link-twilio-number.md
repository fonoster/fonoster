# Link an Application to a Twilio Number

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
131ff7f4-8359-41a6-b701-02283ecdda9b    Enma at Bella Ristorante      tel:+19842051452 (US)
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
