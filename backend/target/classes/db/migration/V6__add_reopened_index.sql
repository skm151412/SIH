-- Add index for reopened complaints
CREATE INDEX idx_complaints_reopened ON complaints(reopened);