CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE users (
    First_name text not null,
    Last_name text not null,
    Email_address text not null unique,
    hashed_password text not null
);
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20231205033526');
