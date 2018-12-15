window.api_key = 'special-key'

describe 'SwaggerHttp for version 1.2 spec', ->
  
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
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a GET", ->
      params = {
        headers: {}
        petId: 1
      }
      opts = {
        mock: true
      }

      window.response = swagger.pet.getPetById(params, opts, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "GET"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/1")

    it "verifies the http request object for a GET with query params", ->
      params = {
        headers: {}
        status: "available"
      }
      opts = {
        mock: true
      }

      window.response = swagger.pet.findPetsByStatus(params, opts, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "GET"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/findByStatus?status=available")

  describe "execute post operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a POST", ->
      params = {
        body: JSON.stringify({
          id: 100
          name: "monster"
          status: "dead"
        })
      }
      opts = {
        mock: true
      }
      window.response = swagger.pet.addPet(params, opts, success_callback, error_callback)

      waitsFor ->
        window.response?

      runs ->
        obj = window.response
        log obj
        expect(obj.method).toBe "POST"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.headers["Content-Type"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet")

    it "verifies the http request object for a POST with form params", ->
      params = {
        headers: {}
        petId: 1
        name: "dog"
        status: "very happy"
      }
      opts = {
        mock: true
      }

      window.response = swagger.pet.updatePetWithForm(params, opts, success_callback, error_callback)

      waitsFor ->
        window.response?

      runs ->
        obj = window.response
        log obj
        expect(obj.body).toBe "name=dog&status=very%20happy"
        expect(obj.method).toBe "POST"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/1")

  describe "execute put operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a PUT", ->
      params = {
        body: JSON.stringify({
          id: 100
          name: "monster"
          status: "dead"
        })
      }
      opts = {
        mock: true
      }

      window.response = swagger.pet.updatePet(params, opts, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "PUT"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.headers["Content-Type"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet")


  describe "execute delete operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a DELETE", ->
      params = {
        petId: 100
      }
      opts = {
        mock: true
      }

      window.response = swagger.pet.deletePet(params, opts, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "DELETE"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.headers["Content-Type"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/100")

  describe "query params should be single encoded", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a DELETE", ->
      params = {
        status: "a b c d e"
      }
      opts = {
        mock: true
      }

      window.response = swagger.pet.findPetsByStatus(params, opts, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "GET"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/findByStatus?status=a%20b%20c%20d%20e")
