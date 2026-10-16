-- Database roles for the provider registry (add-provider-registry P8.7, task 2.7).
-- Run as the database owner after migrations, once per database; safe to run again.
--
-- fonoster_registry: the role the fonoster-registry utility connects as. It writes the registry
--   and audit tables, stores workspace notices and webhook deliveries, and may change only the
--   speech fields of apps and the config of assistants (retire rewrites). Nothing else.
-- fonoster_registry_reader: read-only access to the registry tables. Grant it to the apiserver's
--   and the gateway's login roles. It only restricts a role that does not own the tables, so the
--   services must not connect as the migration owner.
--
-- Login roles are created by the operator, e.g.:
--   CREATE ROLE registry_ops LOGIN PASSWORD '...' IN ROLE fonoster_registry;
--   GRANT fonoster_registry_reader TO apiserver;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fonoster_registry') THEN
    CREATE ROLE fonoster_registry NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fonoster_registry_reader') THEN
    CREATE ROLE fonoster_registry_reader NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO fonoster_registry, fonoster_registry_reader;

-- Catalog: full write. Audit: append-only.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON registry_providers, registry_models, registry_voices, registry_voice_models
  TO fonoster_registry;
GRANT SELECT, INSERT ON registry_audit, registry_notices TO fonoster_registry;
GRANT USAGE, SELECT ON SEQUENCE registry_audit_seq_seq TO fonoster_registry;
-- Runtime session counts for `usage` (written by the apiserver, LO-B11): read-only here.
GRANT SELECT ON registry_usage TO fonoster_registry;

-- Usages: read apps and assistants; rewrite only their catalog ids.
GRANT SELECT ON applications, intelligence_services TO fonoster_registry;
GRANT UPDATE (speech_voice, speech_tts_model, speech_stt_model, speech_settings, updated_at)
  ON applications TO fonoster_registry;
GRANT UPDATE (config) ON intelligence_services TO fonoster_registry;

-- provider.deprecated webhooks: read endpoints, write deliveries.
GRANT SELECT ON webhook_endpoints TO fonoster_registry;
GRANT SELECT, INSERT, UPDATE ON webhook_deliveries TO fonoster_registry;

-- Readers: the registry tables, read-only.
GRANT SELECT
  ON registry_providers, registry_models, registry_voices, registry_voice_models,
     registry_audit, registry_notices, registry_usage
  TO fonoster_registry_reader;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON registry_providers, registry_models, registry_voices, registry_voice_models,
     registry_audit, registry_notices, registry_usage
  FROM fonoster_registry_reader;
