-- Add address column to complaints table
ALTER TABLE complaints ADD COLUMN address VARCHAR(255) AFTER location_lng;