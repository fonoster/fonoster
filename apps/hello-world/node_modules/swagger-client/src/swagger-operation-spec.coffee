window.api_key = 'special-key'

describe 'Operations for version 1.2 spec', ->

  beforeEach ->
    success =  ->
      log "success"
    window.authorizations.add "key", new ApiKeyAuthorization("api_key", "special-key", "header")
    window.swagger = new SwaggerApi({url: 'http://localhost:8002/api/api-docs', success: success})
    waitsFor ->
      swagger.ready?

  describe "verifies the nickname is sanitized", ->
    it "returns the same nickname", ->
      pet = window.swagger.apis.pet
      expect(pet.sanitize("getSomething")).toBe "getSomething"

    it "strips spaces in the nickname", ->
      pet = window.swagger.apis.pet
      expect(pet.sanitize("get something")).toBe "get_something"

    it "strips dots in the nickname", ->
      pet = window.swagger.apis.pet
      expect(pet.sanitize("get.something")).toBe "get_something"

    it "strips $ in the nickname", ->
      pet = window.swagger.apis.pet
      expect(pet.sanitize("get$something")).toBe "get_something"

    it "strips punctuation in the nickname", ->
      pet = window.swagger.apis.pet
      expect(pet.sanitize("get[something]")).toBe "get_something"

    it "strips curlies in the nickname", ->
      pet = window.swagger.apis.pet
      expect(pet.sanitize("get{something}")).toBe "get_something"

    it "strips punctuation in the nickname", ->
      pet = window.swagger.apis.pet
      expect(pet.sanitize("  \\]}{Get$$_./\[something]")).toBe "Get_something"

  describe "verifies the get pet operation", ->

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
      operation = swagger.pet.operations.getPetById

      log operation

      responseMessages = operation.responseMessages
      expect(responseMessages).toBeDefined
      expect(responseMessages.length).toBe 2
      expect(responseMessages[0].code).toBe 400
      expect(responseMessages[1].code).toBe 404

    it "gets help() from the get pet operation", ->
      operation = swagger.pet.operations.getPetById
      expect(operation.help()).toBe "* petId (required) - ID of pet that needs to be fetched"

    it "verifies the get pet operation", ->
      operation = swagger.pet.operations.getPetById
      expect(operation.method).toBe "get"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      expect(param.name).toBe "petId"
      expect(param.type).toBe "integer"
      expect(param.paramType).toBe "path"
      expect(param.description).toBeDefined

    it "verifies the post pet operation", ->
      operation = swagger.pet.operations.addPet
      expect(operation.method).toBe "post"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      expect(param.name).toBe "body"
      expect(param.type).toBe "Pet"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined

    it "verifies the put pet operation", ->
      operation = swagger.pet.operations.updatePet
      expect(operation.method).toBe "put"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      expect(param.name).toBe "body"
      expect(param.type).toBe "Pet"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined
    it "verifies the findByTags operation", ->
      operation = swagger.pet.operations.findPetsByTags
      expect(operation.method).toBe "get"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      log param
      expect(param.name).toBe "tags"
      expect(param.type).toBe "string"
      expect(param.paramType).toBe "query"
      expect(param.description).toBeDefined

    it "verifies the patch pet operation", ->
      operation = swagger.pet.operations.partialUpdate
      expect(operation.method).toBe "patch"

      produces = operation.produces
      expect(produces.length).toBe 2
      expect(produces[0]).toBe "application/json"
      expect(produces[1]).toBe "application/xml"

      parameters = operation.parameters
      expect(parameters).toBeDefined
      expect(parameters.length).toBe 2

      param = parameters[0]
      expect(param.name).toBe "petId"
      expect(param.type).toBe "string"
      expect(param.paramType).toBe "path"
      expect(param.description).toBeDefined

      param = parameters[1]
      expect(param.name).toBe "body"
      expect(param.type).toBe "Pet"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined

    it "verifies the post pet operation with form", ->
      operation = swagger.pet.operations.updatePetWithForm
      expect(operation.method).toBe "post"

      consumes = operation.consumes
      expect(consumes.length).toBe 1
      expect(consumes[0]).toBe "application/x-www-form-urlencoded"

      parameters = operation.parameters
      expect(parameters).toBeDefined
      expect(parameters.length).toBe 3

      param = parameters[0]
      expect(param.name).toBe "petId"
      expect(param.type).toBe "string"
      expect(param.paramType).toBe "path"
      expect(param.description).toBeDefined

      param = parameters[1]
      expect(param.name).toBe "name"
      expect(param.type).toBe "string"
      expect(param.paramType).toBe "form"
      expect(param.description).toBeDefined
      expect(param.required).toBe false

      param = parameters[2]
      expect(param.name).toBe "status"
      expect(param.type).toBe "string"
      expect(param.paramType).toBe "form"
      expect(param.description).toBeDefined
      expect(param.required).toBe false

    it "verifies a file upload", ->
      operation = swagger.pet.operations.uploadFile
      expect(operation.method).toBe "post"

      consumes = operation.consumes
      expect(consumes.length).toBe 1
      expect(consumes[0]).toBe "multipart/form-data"

      parameters = operation.parameters
      expect(parameters).toBeDefined
      expect(parameters.length).toBe 2

      param = parameters[0]
      expect(param.name).toBe "additionalMetadata"
      expect(param.type).toBe "string"
      expect(param.paramType).toBe "form"
      expect(param.required).toBe false
      expect(param.description).toBeDefined

      param = parameters[1]
      expect(param.name).toBe "file"
      expect(param.type).toBe "File"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined
      expect(param.required).toBe false


    it "gets operations for the pet api", ->
      ops = swagger.pet.operations
      expect(ops).toBeDefined

    it "gets help() from the file upload operation", ->
      operation = swagger.pet.operations.uploadFile
      expect(operation.help()).toBe "* additionalMetadata - Additional data to pass to server\n* file - file to upload"
