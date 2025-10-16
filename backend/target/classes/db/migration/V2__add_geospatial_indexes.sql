-- Add spatial indexes to complaints table for improved geospatial query performance
CREATE INDEX idx_complaint_location ON complaints (location_lat, location_lng);