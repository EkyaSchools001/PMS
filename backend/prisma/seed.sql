-- Seed Admin User
INSERT INTO "User" ("id", "email", "fullName", "passwordHash", "role")
VALUES ('cl0000admin', 'admin@pms.com', 'Admin User', '$2a$10$6k0dC7TrAfymzMSxT3PMvOORxRLM0Up.zP92yaITBkLcsnacfa.gK', 'ADMIN')
ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN';

-- Seed IT Manager
INSERT INTO "User" ("id", "email", "fullName", "passwordHash", "role", "campusAccess")
VALUES ('cl0001it', 'itmanager@ekya.edu.in', 'IT Manager', '$2a$10$6k0dC7TrAfymzMSxT3PMvOORxRLM0Up.zP92yaITBkLcsnacfa.gK', 'MANAGER', 'Campus A, Campus B, Campus C')
ON CONFLICT ("email") DO UPDATE SET "role" = 'MANAGER';

-- Note: The password for both is 'password123'
