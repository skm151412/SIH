-- Add feedback-related columns to the complaints table
ALTER TABLE complaints 
ADD COLUMN rating INT,
ADD COLUMN feedback TEXT,
ADD COLUMN reopened BOOLEAN DEFAULT FALSE,
ADD COLUMN reopen_reason TEXT,
ADD CONSTRAINT check_rating CHECK (rating >= 1 AND rating <= 5);

-- Add index to help with queries filtering by rating
CREATE INDEX idx_complaints_rating ON complaints(rating);