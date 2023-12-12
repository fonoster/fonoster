# Make an outbound call

You can initiate a phone call using NodeJS with a Fonoster Number with a single API request.

First, create a new script with the following content:

```javascript
# call.js
const Fonoster = require("@fonoster/sdk");
const callManager = new Fonoster.CallManager({
  accessKeyId: "PJ619154d081467a0700000001",
  accessKeySecret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ25vc3RlciIsInJvbGUiOiJQUk9KRUNUIiwiYWNjZXNz"
});

callManager.call({
 from: "+19842753574",
 to: "17853178070",
 webhook: "https://5a2d2ea5d84d.ngrok.io"
})
  .then(console.log)
  .catch(console.error);
```

Next, replace the `from`, `to`, `webhook` as well as the `accessKeyId` and `accessKeySecret`

Unlike the previous guides, you must use a "real" number from a Voip Provider.

Also, remember that you need a set of Project credentials instead of Account credentials.

## Make an outbound call

Now we are ready to save the changes and run the code by copying the following command into your terminal: 

```bash
node call.js
```

That's it! Your phone should ring with a call from your Fonoster Number, and you'll hear our short message.
