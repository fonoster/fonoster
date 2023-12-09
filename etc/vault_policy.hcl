path "secret/data/{{identity.entity.id}}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}