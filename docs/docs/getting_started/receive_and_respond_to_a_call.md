# Receive and respond to a call

Fonoster can accept calls from different sources, such as phones, web pages, and mobile devices, with the ability to connect them with your Programmable Voice Application using a Webhook.

When your Number receives an incoming phone call, it will send an HTTP request to a server you control. This callback mechanism is known as a Webhook. 

When the request is made from Fonoster to your application, it expects a response in JSON format. That tells it how it's going to respond to the call.

If everything went well with the prior guides, all that is left is to call your Number using a mobile or landline. 

Start your app

```none
LOGS_LEVEL=verbose node index.js
```

You will see a series of logs on your terminal.
