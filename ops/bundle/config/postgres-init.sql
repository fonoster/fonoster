-- Databases next to Routr's (POSTGRES_DB=routr): the apiserver's and Identity's. Runs once, when
-- the Postgres volume is created. The apiserver applies their migrations at start.
CREATE DATABASE fonoster;
CREATE DATABASE fnidentity;
