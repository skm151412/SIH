-- Add due_date and escalated columns to complaints table
ALTER TABLE complaints 
ADD COLUMN due_date TIMESTAMP,
ADD COLUMN escalated BOOLEAN DEFAULT FALSE;

-- Update existing complaints with a default due_date (72 hours from creation)
UPDATE complaints 
SET due_date = DATE_ADD(created_at, INTERVAL 72 HOUR) 
WHERE due_date IS NULL;

-- Make due_date NOT NULL after setting default values
ALTER TABLE complaints 
MODIFY COLUMN due_date TIMESTAMP NOT NULL;

-- Add index for efficient querying of overdue complaints
CREATE INDEX idx_complaints_due_date ON complaints(due_date);
CREATE INDEX idx_complaints_escalated ON complaints(escalated);