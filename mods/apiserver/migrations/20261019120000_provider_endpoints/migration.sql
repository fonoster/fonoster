-- Catalog entries as ordinary data for every provider, the fakes included (fake-providers):
-- where a provider serves each capability, keyless providers, and display labels.
ALTER TABLE "registry_providers" ADD COLUMN "endpoints" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "registry_providers" ALTER COLUMN "credential_ref" DROP NOT NULL;
ALTER TABLE "registry_providers" ADD COLUMN "label" VARCHAR(255);
ALTER TABLE "registry_models" ADD COLUMN "label" VARCHAR(255);
ALTER TABLE "registry_voices" ADD COLUMN "label" VARCHAR(255);
