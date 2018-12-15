window.api_key = 'special-key'

describe 'SwaggerRequest for version 1.2 spec', ->
  
  beforeEach ->
    success =  ->
      log "success"
    window.authorizations.add "key", new ApiKeyAuthorization("api_key", "special-key", "header")
    window.swagger = new SwaggerApi({url: 'http://localhost:8002/api/api-docs', success: success})
    waitsFor ->
      swagger.ready?

  describe "execute get operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.operation = swagger.pet.operations.getPetById
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "fetches an object with json", ->
      params = {}
      opts = {
        requestContentType: null
        responseContentType: "application/json"
      }

      new SwaggerRequest("GET", "http://localhost:8002/api/pet/1", params, opts, window.success_callback, window.error_callback, operation)

      window.args =
        petId: '1'

     waitsFor ->
       window.response?

      runs ->
        data = window.response.data
        pet = JSON.parse(data)

        expect(pet).toBeDefined
        expect(pet.id).toBe 1
        expect(window.error).toBe null

    it "fetches an object with xml", ->
      params = {}
      opts = {
        requestContentType: "application/xml"
        responseContentType: null
      }

      new SwaggerRequest("GET", "http://localhost:8002/api/pet/1", params, opts, success_callback, error_callback, operation)

      window.args =
        petId: '1'

     waitsFor ->
       window.response?

      runs ->
        data = window.response.data
        if window.DOMParser
          parser = new window.DOMParser()
          pet = parser.parseFromString(data, "text/xml")
        else
          parser = new ActiveXObject("Microsoft.XMLDOM")
          parser.async = false
          pet = parser.loadXML(data)

        expect(pet).toBeDefined

    it "fetches an object with plain text", ->
      params = {}
      opts = {
        requestContentType: "text/plain"
        responseContentType: "text/plain"
      }

      new SwaggerRequest("GET", "http://localhost:8002/api/pet/1", params, opts, success_callback, error_callback, operation)

      window.args =
        petId: '1'

     waitsFor ->
       window.response?

      runs ->
        pet = window.response.data
        expect(pet).toBe "Pet(id=1, category=Category(id=2, name=Cats), name=Cat 1, photoUrls=[url1, url2], tags=[Tag(id=1, name=tag1), Tag(id=2, name=tag2)], status=available)"

    it "fetches an object as html", ->
      params = {}
      opts = {
        requestContentType: null
        responseContentType: "text/html"
      }

      new SwaggerRequest("GET", "http://localhost:8002/api/pet/1", params, opts, success_callback, error_callback, operation)

      window.args =
        petId: '1'

     waitsFor ->
       window.response?

      runs ->
        pet = window.response.data
        log pet

  describe "execute post operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = ->
        'mock callback'
      window.error = ->
        'mock error'
      window.operation = swagger.pet.operations.getPetById

    it "adds an object with json", ->
      params = {
        body: JSON.stringify({
          id: 100
          name: "monster"
          status: "dead"
        })
      }
      opts = {
        requestContentType: "application/json"
        responseContentType: "application/json"
      }

      new SwaggerRequest("POST", "http://localhost:8002/api/pet", params, opts, success_callback, error_callback, operation)

     waitsFor ->
       window.response?

      runs ->
        data = window.response.data
        resp = JSON.parse(data)
        expect(resp.code).toBe 200

    it "adds an object with xml", ->
      params = {
        headers: {}
        body: "<Pet><id>101</id><category><id>2</id><name>Cats</name></category><name>Cat 1</name><photoUrls>url1</photoUrls><photoUrls>url2</photoUrls><tags><id>1</id><name>tag1</name></tags><tags><id>2</id><name>tag2</name></tags><status>available</status></Pet>"
      }
      opts = {
        requestContentType: "application/xml"
        responseContentType: "application/xml"    
      }

      new SwaggerRequest("POST", "http://localhost:8002/api/pet", params, opts, success_callback, error_callback, operation)

      waitsFor ->
        window.response?

      runs ->
        resp = window.response

  describe "execute put operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = ->
        'mock callback'
      window.error = ->
        'mock error'
      window.operation = swagger.pet.operations.getPetById

    it "updates an object with json", ->
      params = {
        body: JSON.stringify({
          id: 1
          name: "monster"
          status: "alive"
        })
      }
      opts = {
        requestContentType: "application/json"
        responseContentType: "application/json"
      }

      new SwaggerRequest("PUT", "http://localhost:8002/api/pet", params, opts, success_callback, error_callback, operation)

     waitsFor ->
       window.response?

      runs ->
        data = window.response.data
        resp = JSON.parse(data)
        expect(resp.code).toBe 200

    it "updates an object with xml", ->
      params = {
        headers: {}
        body: "<Pet><id>1</id><category><id>2</id><name>Cats</name></category><name>Cat 1</name><photoUrls>url1</photoUrls><photoUrls>url2</photoUrls><tags><id>1</id><name>tag1</name></tags><tags><id>2</id><name>tag2</name></tags><status>available</status></Pet>"
      }
      opts = {
        requestContentType: "application/xml"
        responseContentType: "application/xml"
      }

      new SwaggerRequest("PUT", "http://localhost:8002/api/pet", params, opts, success_callback, error_callback, operation)

     waitsFor ->
       window.response?

      runs ->
        resp = window.response
        #expect(resp.code).toBe 200

  describe "execute delete operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data
      window.operation = swagger.pet.operations.getPetById

    it "deletes an object", ->
      window.success_callback = (data) ->
        window.response = "successfully deleted pet"
      params = {}
      new SwaggerRequest("DELETE", "http://localhost:8002/api/pet/100", params, {}, success_callback, error_callback, operation)

     waitsFor ->
       window.response?

      runs ->
        resp = window.response
        expect(resp).toBe("successfully deleted pet")

  describe "execute options call", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data
      window.operation = swagger.pet.operations.getPetById

    it "gets options on the pet resource", ->
      window.success_callback = (data) ->
        window.response = "successfully fetched options"
      params = {}
      new SwaggerRequest("OPTIONS", "http://localhost:8002/api/pet", params, {}, success_callback, error_callback, operation)

     waitsFor ->
       window.response?

      runs ->
        resp = window.response
        expect(resp).toBe("successfully fetched options")

  describe "execute patch call", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data
      window.operation = swagger.pet.operations.getPetById

    it "merges an object", ->
      window.success_callback = (data) ->
        window.response = "successfully patched pet"
      params = {
        body: JSON.stringify({name: "ghoul"})
      }
      opts = {
        requestContentType: "application/json"
        responseContentType: "application/json"
      }

      new SwaggerRequest("PATCH", "http://localhost:8002/api/pet/3", params, opts, success_callback, error_callback, operation)

      waitsFor ->
         window.response?

      runs ->
        resp = window.response
        expect(resp).toBe("successfully patched pet")
  
  describe "api key authorizations", ->
    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "applies an api key to the query string", ->
      params = {}
      opts = {
        requestContentType: null
        responseContentType: "application/json"
      }

      auth = new ApiKeyAuthorization("api_key", "abc123", "query")

      window.authorizations.add "key", auth

      new SwaggerRequest("GET", "http://localhost:8002/api/pet/1", params, opts, window.success_callback, window.error_callback, operation)

      window.args =
        petId: '1'

     waitsFor ->
       window.response?

      runs ->
        data = window.response.data
        pet = JSON.parse(data)

        expect(pet).toBeDefined
        expect(pet.id).toBe 1
        expect(window.error).toBe null

    it "applies an api key as a header", ->
      params = {}
      opts = {
        requestContentType: null
        responseContentType: "application/json"
      }

      auth = new ApiKeyAuthorization("api_key", "abc123", "header")

      window.authorizations.add "key", auth

      new SwaggerRequest("GET", "http://localhost:8002/api/pet/1", params, opts, window.success_callback, window.error_callback, operation)

      window.args =
        petId: '1'

     waitsFor ->
       window.response?

      runs ->
        data = window.response.data
        pet = JSON.parse(data)

        expect(pet).toBeDefined
        expect(pet.id).toBe 1
        expect(window.error).toBe null

