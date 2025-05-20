-- Create a default user for the system
INSERT INTO "User" (
  id, 
  name, 
  email, 
  "emailVerified", 
  password, 
  role, 
  "createdAt", 
  "updatedAt"
) 
VALUES (
  '574c1069-9130-4fdc-9e1c-a02994e4d047', 
  'Admin User', 
  'admin@example.com', 
  NOW(), 
  'password', 
  'ADMIN', 
  NOW(), 
  NOW()
); 