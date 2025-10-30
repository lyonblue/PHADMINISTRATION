-- Agregar campo avatar_url a testimonials
ALTER TABLE testimonials 
ADD COLUMN avatar_url TEXT AFTER user_name;

