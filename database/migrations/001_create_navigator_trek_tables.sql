-- ViaHimalaya Navigator Trek Tables Migration
-- This script creates tables for storing navigator trek data from mobile app

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create navigator_treks table
CREATE TABLE IF NOT EXISTS navigator_treks (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    trek_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points table for GPS tracking data
CREATE TABLE IF NOT EXISTS points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    navigator_trek_id VARCHAR(255) NOT NULL REFERENCES navigator_treks(id) ON DELETE CASCADE,
    lat DECIMAL(10, 7) NOT NULL,
    lon DECIMAL(10, 7) NOT NULL,
    timestamp BIGINT NOT NULL,
    alt_gps DECIMAL(8, 2),
    alt_baro DECIMAL(8, 2),
    accuracy_h DECIMAL(6, 2),
    accuracy_v DECIMAL(6, 2),
    speed DECIMAL(6, 2),
    bearing DECIMAL(6, 2),
    battery INTEGER,
    raw_sensors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_navigator_treks_user_id ON navigator_treks(user_id);
CREATE INDEX IF NOT EXISTS idx_navigator_treks_trek_id ON navigator_treks(trek_id);
CREATE INDEX IF NOT EXISTS idx_navigator_treks_created_at ON navigator_treks(created_at);

CREATE INDEX IF NOT EXISTS idx_points_navigator_trek_id ON points(navigator_trek_id);
CREATE INDEX IF NOT EXISTS idx_points_timestamp ON points(timestamp);
CREATE INDEX IF NOT EXISTS idx_points_location ON points(lat, lon);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON points(created_at);

-- Create a composite index for efficient trek path queries
CREATE INDEX IF NOT EXISTS idx_points_trek_timestamp ON points(navigator_trek_id, timestamp);

-- Add trigger to update updated_at timestamp on navigator_treks table
CREATE OR REPLACE FUNCTION update_navigator_treks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_navigator_treks_timestamp
    BEFORE UPDATE ON navigator_treks
    FOR EACH ROW
    EXECUTE FUNCTION update_navigator_treks_updated_at();

-- Add comments for documentation
COMMENT ON TABLE navigator_treks IS 'Navigator trek records from mobile app';
COMMENT ON TABLE points IS 'GPS tracking points with sensor data for each navigator trek';

COMMENT ON COLUMN navigator_treks.id IS 'Unique identifier for the navigator trek (from mobile app)';
COMMENT ON COLUMN navigator_treks.user_id IS 'User who recorded this trek';
COMMENT ON COLUMN navigator_treks.trek_id IS 'Reference to the trek being navigated';

COMMENT ON COLUMN points.navigator_trek_id IS 'Foreign key reference to the parent navigator trek';
COMMENT ON COLUMN points.lat IS 'Latitude in decimal degrees';
COMMENT ON COLUMN points.lon IS 'Longitude in decimal degrees';
COMMENT ON COLUMN points.timestamp IS 'Unix timestamp in milliseconds when this GPS point was recorded';
COMMENT ON COLUMN points.alt_gps IS 'GPS-derived altitude in meters';
COMMENT ON COLUMN points.alt_baro IS 'Barometric altitude in meters';
COMMENT ON COLUMN points.accuracy_h IS 'Horizontal GPS accuracy in meters';
COMMENT ON COLUMN points.accuracy_v IS 'Vertical GPS accuracy in meters';
COMMENT ON COLUMN points.speed IS 'Ground speed in meters per second';
COMMENT ON COLUMN points.bearing IS 'Direction of travel in degrees (0-360)';
COMMENT ON COLUMN points.battery IS 'Device battery percentage at time of recording';
COMMENT ON COLUMN points.raw_sensors IS 'Raw sensor data (accelerometer, gyroscope, magnetometer, pressure) in JSON format';

-- Create a view for easy navigator trek summary queries
CREATE OR REPLACE VIEW navigator_trek_summaries AS
SELECT
    nt.id,
    nt.user_id,
    nt.trek_id,
    nt.created_at,
    COUNT(p.id) as total_points,
    MIN(p.timestamp) as first_point_time,
    MAX(p.timestamp) as last_point_time,
    MIN(p.alt_gps) as min_altitude,
    MAX(p.alt_gps) as max_altitude,
    AVG(p.speed) as avg_speed
FROM navigator_treks nt
LEFT JOIN points p ON nt.id = p.navigator_trek_id
GROUP BY nt.id, nt.user_id, nt.trek_id, nt.created_at;

COMMENT ON VIEW navigator_trek_summaries IS 'Summary view with navigator trek statistics';
