-- Agregar campo avatar_url a users (si no existe)
ALTER TABLE users 
ADD COLUMN avatar_url TEXT AFTER full_name;

