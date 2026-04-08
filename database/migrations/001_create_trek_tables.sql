-- ViaHimalaya Trek Data Tables Migration
-- This script creates the necessary tables for storing trek and GPS path data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create treks table
CREATE TABLE IF NOT EXISTS treks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guide_id VARCHAR(255),
    trek_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    description TEXT,
    difficulty_level VARCHAR(50),
    region VARCHAR(255),
    metadata JSONB, -- Store additional trek metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create path_points table for GPS data
CREATE TABLE IF NOT EXISTS path_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trek_id UUID NOT NULL REFERENCES treks(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    lat DECIMAL(10, 7) NOT NULL, -- Latitude with 7 decimal precision (~1cm accuracy)
    lon DECIMAL(10, 7) NOT NULL, -- Longitude with 7 decimal precision
    alt_gps DECIMAL(8, 2), -- GPS altitude in meters
    alt_baro DECIMAL(8, 2), -- Barometric altitude in meters
    accuracy_h DECIMAL(6, 2), -- Horizontal accuracy in meters
    accuracy_v DECIMAL(6, 2), -- Vertical accuracy in meters
    sat_count INTEGER, -- Number of satellites
    speed DECIMAL(6, 2), -- Speed in m/s
    bearing DECIMAL(6, 2), -- Bearing in degrees
    battery INTEGER, -- Battery percentage
    raw_sensors JSONB, -- Raw sensor data (accelerometer, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_treks_guide_id ON treks(guide_id);
CREATE INDEX IF NOT EXISTS idx_treks_start_time ON treks(start_time);
CREATE INDEX IF NOT EXISTS idx_treks_region ON treks(region);
CREATE INDEX IF NOT EXISTS idx_treks_created_at ON treks(created_at);

CREATE INDEX IF NOT EXISTS idx_path_points_trek_id ON path_points(trek_id);
CREATE INDEX IF NOT EXISTS idx_path_points_timestamp ON path_points(timestamp);
CREATE INDEX IF NOT EXISTS idx_path_points_location ON path_points(lat, lon);
CREATE INDEX IF NOT EXISTS idx_path_points_created_at ON path_points(created_at);

-- Create a composite index for efficient trek path queries
CREATE INDEX IF NOT EXISTS idx_path_points_trek_timestamp ON path_points(trek_id, timestamp);

-- Add trigger to update updated_at timestamp on treks table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_treks_updated_at 
    BEFORE UPDATE ON treks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE treks IS 'Main table storing trek metadata and information';
COMMENT ON TABLE path_points IS 'GPS tracking points for each trek with sensor data';

COMMENT ON COLUMN treks.guide_id IS 'Identifier for the guide who recorded this trek';
COMMENT ON COLUMN treks.trek_name IS 'Human-readable name of the trek';
COMMENT ON COLUMN treks.start_time IS 'When the trek recording started';
COMMENT ON COLUMN treks.end_time IS 'When the trek recording ended (optional)';
COMMENT ON COLUMN treks.difficulty_level IS 'Trek difficulty (easy, moderate, difficult, extreme)';
COMMENT ON COLUMN treks.region IS 'Geographic region (e.g., Himachal Pradesh, Uttarakhand)';
COMMENT ON COLUMN treks.metadata IS 'Additional trek information in JSON format';

COMMENT ON COLUMN path_points.trek_id IS 'Foreign key reference to the parent trek';
COMMENT ON COLUMN path_points.timestamp IS 'Unix timestamp when this GPS point was recorded';
COMMENT ON COLUMN path_points.lat IS 'Latitude in decimal degrees';
COMMENT ON COLUMN path_points.lon IS 'Longitude in decimal degrees';
COMMENT ON COLUMN path_points.alt_gps IS 'GPS-derived altitude in meters';
COMMENT ON COLUMN path_points.alt_baro IS 'Barometric altitude in meters';
COMMENT ON COLUMN path_points.accuracy_h IS 'Horizontal GPS accuracy in meters';
COMMENT ON COLUMN path_points.accuracy_v IS 'Vertical GPS accuracy in meters';
COMMENT ON COLUMN path_points.sat_count IS 'Number of GPS satellites used';
COMMENT ON COLUMN path_points.speed IS 'Ground speed in meters per second';
COMMENT ON COLUMN path_points.bearing IS 'Direction of travel in degrees (0-360)';
COMMENT ON COLUMN path_points.battery IS 'Device battery percentage at time of recording';
COMMENT ON COLUMN path_points.raw_sensors IS 'Raw sensor data (accelerometer, gyroscope, etc.) in JSON format';

-- Create a view for easy trek summary queries
CREATE OR REPLACE VIEW trek_summaries AS
SELECT 
    t.id,
    t.guide_id,
    t.trek_name,
    t.start_time,
    t.end_time,
    t.description,
    t.difficulty_level,
    t.region,
    t.created_at,
    COUNT(p.id) as total_points,
    MIN(p.timestamp) as first_point_time,
    MAX(p.timestamp) as last_point_time,
    MIN(p.alt_gps) as min_altitude,
    MAX(p.alt_gps) as max_altitude,
    AVG(p.speed) as avg_speed,
    ST_MakeEnvelope(
        MIN(p.lon), MIN(p.lat), 
        MAX(p.lon), MAX(p.lat), 
        4326
    ) as bounding_box
FROM treks t
LEFT JOIN path_points p ON t.id = p.trek_id
GROUP BY t.id, t.guide_id, t.trek_name, t.start_time, t.end_time, 
         t.description, t.difficulty_level, t.region, t.created_at;

COMMENT ON VIEW trek_summaries IS 'Summary view with trek statistics and bounding box';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON treks TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON path_points TO your_app_user;
-- GRANT SELECT ON trek_summaries TO your_app_user;
-- GRANT USAGE ON SEQUENCE treks_id_seq TO your_app_user;
-- GRANT USAGE ON SEQUENCE path_points_id_seq TO your_app_user;