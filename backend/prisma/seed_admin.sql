-- Create Admin User
INSERT INTO "User" ("id", "email", "passwordHash", "fullName", "role", "createdAt", "updatedAt") 
VALUES (
  'admin-id-123', 
  'admin@pms.com', 
  '$2a$10$YourHashedPasswordHere', -- We need to generate this hash or use a known one
  'Admin User', 
  'ADMIN', 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
);
