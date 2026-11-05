-- Databases next to Routr's (POSTGRES_DB=routr): the apiserver's, Identity's and billing's (empty
-- unless compose.billing.yaml runs). Runs once, when the Postgres volume is created. The apiserver
-- and billing apply their migrations at start.
CREATE DATABASE fonoster;
CREATE DATABASE fnidentity;
CREATE DATABASE billing;
