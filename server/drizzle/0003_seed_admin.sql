INSERT INTO "events" ("name")
SELECT 'Wedding Day Event'
WHERE NOT EXISTS (SELECT 1 FROM "events");

INSERT INTO "users" ("email", "password_hash", "name", "role", "host_type", "event_id")
SELECT
  'admin',
  '$2a$12$.7ujemn31kTZPUHKTqghpONeJwmLAtasCVQ28IqIiwK2OyDzgmOcu',
  'admin',
  'admin',
  NULL,
  (SELECT "id" FROM "events" ORDER BY "id" LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'admin');
