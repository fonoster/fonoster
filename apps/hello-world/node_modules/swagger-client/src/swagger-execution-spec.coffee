window.api_key = 'special-key'

describe 'SwaggerRequest for version 1.2 spec', ->
  
  beforeEach ->
    success =  ->
      log "success"
    window.authorizations.add "key", new ApiKeyAuthorization("api_key", "special-key", "header")
    window.swagger = new SwaggerApi({url: 'http://localhost:8002/api/api-docs', success: success})
    waitsFor ->
      swagger.ready?

  describe "builds a get request object", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the response messages from the get operation", ->
      swagger.pet.getPetById({petId: 1}, window.success_callback)

      waitsFor ->
        window.response?

      runs ->
        pet = JSON.parse(window.response.data)
        expect(pet.id).toBe 1

    it "verifies the response messages from the get operation with query params", ->
      swagger.pet.findPetsByStatus({status: "available"}, window.success_callback)

      waitsFor ->
        window.response?

      runs ->
        pet = JSON.parse(window.response.data)
        log(pet)
        expect(pet.code).toNotBe 400
