-- Add original_complaint_id column to complaints table to track duplicates
ALTER TABLE complaints 
ADD COLUMN original_complaint_id BIGINT NULL,
ADD CONSTRAINT fk_original_complaint 
    FOREIGN KEY (original_complaint_id) 
    REFERENCES complaints(complaint_id);

-- Create index for duplicate detection
CREATE INDEX idx_complaints_category_location_time ON complaints(category, location_lat, location_lng, created_at);