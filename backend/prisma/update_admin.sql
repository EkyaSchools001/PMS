-- Update Admin Password to 'password123'
UPDATE "User" 
SET "passwordHash" = '$2a$10$0f1ThUppTfjRzn8evaxoj.uCytZNvnNaSYtCACyuIOlljoUH/JFZy'
WHERE "email" = 'admin@pms.com';
