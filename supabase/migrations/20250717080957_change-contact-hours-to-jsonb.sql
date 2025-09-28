ALTER TABLE COURSES 
ALTER COLUMN contact_hours 
SET DATA TYPE jsonb
USING contact_hours::jsonb;