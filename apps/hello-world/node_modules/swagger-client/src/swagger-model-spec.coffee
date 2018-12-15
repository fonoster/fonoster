window.api_key = 'special-key'

describe 'Swagger models version 1.2 spec', ->

  beforeEach ->
    success =  ->
      ""
    window.authorizations.add "key", new ApiKeyAuthorization("api_key", "special-key", "header")
    window.swagger = new SwaggerApi({url: 'http://localhost:8002/api/api-docs', success: success})
    waitsFor ->
      swagger.ready?

  describe "get model operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the Pet model", ->
      pet = window.swagger.apis.pet.models["Pet"]
      expect(pet.name).toBe("Pet")
      expect(pet.properties.length).toBe(6)

      props = pet.properties

      expect(props[0].name).toBe("id")
      expect(props[0].dataType).toBe("integer")

      expect(props[1].name).toBe("category")
      expect(props[1].dataType).toBe("Category")

      expect(props[2].name).toBe("name")
      expect(props[2].dataType).toBe("string")

      expect(props[3].name).toBe("photoUrls")
      expect(props[3].dataType).toBe("array")
      expect(props[3].refDataType).toBe("string")

      expect(props[4].name).toBe("tags")
      expect(props[4].dataType).toBe("array")
      expect(props[4].refDataType).toBe("Tag")

      expect(props[5].name).toBe("status")
      expect(props[5].dataType).toBe("string")

    it "verifies the Pet sample JSON", ->
      pet = window.swagger.apis.pet.models["Pet"]
      sample = pet.createJSONSample()
      log sample
      log JSON.stringify sample