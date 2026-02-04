-- Seed Admin User
INSERT INTO "User" ("id", "email", "fullName", "passwordHash", "role", "createdAt", "updatedAt")
VALUES ('cl0000admin', 'admin@pms.com', 'Admin User', '$2a$10$6k0dC7TrAfymzMSxT3PMvOORxRLM0Up.zP92yaITBkLcsnacfa.gK', 'ADMIN', unixepoch() * 1000, unixepoch() * 1000)
ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN', "updatedAt" = unixepoch() * 1000;

-- Seed IT Manager
INSERT INTO "User" ("id", "email", "fullName", "passwordHash", "role", "campusAccess", "createdAt", "updatedAt")
VALUES ('cl0001it', 'itmanager@ekya.edu.in', 'IT Manager', '$2a$10$6k0dC7TrAfymzMSxT3PMvOORxRLM0Up.zP92yaITBkLcsnacfa.gK', 'MANAGER', 'Campus A, Campus B, Campus C', unixepoch() * 1000, unixepoch() * 1000)
ON CONFLICT ("email") DO UPDATE SET "role" = 'MANAGER', "updatedAt" = unixepoch() * 1000;

-- Note: The password for both is 'password123'
