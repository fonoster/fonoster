-- Speech catalog (#1323): a voice's accent, and an application's speech speed (null = normal pace).
ALTER TABLE "registry_voices" ADD COLUMN "accent" VARCHAR(64);
ALTER TABLE "applications" ADD COLUMN "speech_speed" DOUBLE PRECISION;
