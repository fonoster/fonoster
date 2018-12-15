This is the Wordnik Swagger javascript client for use with [swagger](http://swagger.wordnik.com) enabled APIs.
It's written in CoffeeScript and tested with Jasmine, and is the fastest way to enable a javascript client to communicate with a swagger-enabled server.

Find out more about the swagger project at [swagger.wordnik.com](http://swagger.wordnik.com),
and follow us on Twitter at [@swagger_doc](https://twitter.com/#!/swagger_doc).

## READ MORE about swagger!

See the [swagger website](http://swagger.wordnik.com) or the [swagger-core wiki](https://github.com/wordnik/swagger-core/wiki), which contains information about the swagger json spec.

### Calling an API with swagger + node.js!

Install swagger-client:
```
npm install swagger-client
```

Then let swagger do the work!
```js
var client = require("swagger-client")

var swagger = new client.SwaggerApi({
  url: 'http://petstore.swagger.wordnik.com/api/api-docs',
  success: function() {
    if(swagger.ready === true) {
      swagger.apis.pet.getPetById({petId:1});
    }
  }
});

```

That's it!  You'll get a JSON response with the default callback handler:

```json
{
  "id": 1,
  "category": {
    "id": 2,
    "name": "Cats"
  },
  "name": "Cat 1",
  "photoUrls": [
    "url1",
    "url2"
  ],
  "tags": [
    {
      "id": 1,
      "name": "tag1"
    },
    {
      "id": 2,
      "name": "tag2"
    }
  ],
  "status": "available"
}
```

Need to pass an API key?  Configure one as a querystring:

```js
client.authorizations.add("apiKey", new client.ApiKeyAuthorization("api_key","special-key","query"));
```

...or with a header:

```js
client.authorizations.add("apiKey", new client.ApiKeyAuthorization("api_key","special-key","header"));
```

### Calling an API with swagger + the browser!

Download `swagger.js` and `shred.bundle.js` into your lib folder

```js
<script src='lib/shred.bundle.js' type='text/javascript'></script>
<script src='lib/swagger.js' type='text/javascript'></script>
<script type="text/javascript">
  // initialize swagger, point to a resource listing
  window.swagger = new SwaggerApi({
    url: "http://petstore.swagger.wordnik.com/api/api-docs.json",
    success: function() {
      if(swagger.ready === true) {
        // upon connect, fetch a pet and set contents to element "mydata"
        swagger.apis.pet.getPetById({petId:1}, function(data) {
          document.getElementById("mydata").innerHTML = data.content.data;
        });
      }
    }
  });

</script>
```

### Need to send an object to your API via POST or PUT?
```js
var body = {
  id: 100,
  name: "dog"};

swagger.apis.pet.addPet({body: JSON.stringify(body)});
```

### Sending XML in as a payload to your API?
```js
var body = "<Pet><id>2</id><name>monster</name></Pet>";

swagger.apis.pet.addPet({body: body},{requestContentType:"application/xml"});
```

### Need XML response?
```js
swagger.apis.pet.getPetById({petId:1},{responseContentType:"application/xml"});
```

### How does it work?
The swagger javascript client reads the swagger api definition directly from the server.  As it does, it constructs a client based on the api definition, which means it is completely dynamic.  It even reads the api text descriptions (which are intended for humans!) and provides help if you need it:

```js
s.apis.pet.getPetById.help()
'* petId (required) - ID of pet that needs to be fetched'
```

The HTTP requests themselves are handled by the excellent [shred](https://github.com/automatthew/shred) library, which has a ton of features itself.  But it runs on both node and the browser.


Development
-----------

Please [fork the code](https://github.com/wordnik/swagger-js) and help us improve
swagger.js. Send us a pull request and **we'll mail you a wordnik T-shirt!**

Swagger.js is written in CoffeeScript, so you'll need Node.js and the
CoffeeScript compiler. For more detailed installation instructions, see
[coffeescript.org/#installation](http://coffeescript.org/#installation).

```bash
# generate the javascript libraries and put them in the `lib` folder

npm run-script build
```

```bash
# The 'dev' task will:
# 1. Open source files in your $EDITOR
# 2. Open and run the Jasmine specs in your browser.
# 3. Watch for changes to CoffeeScript files and auto-compile them to Javascript.

npm run-script dev

# List all cake tasks:
cake
```

License
-------

Copyright 2011-2014 Wordnik, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
