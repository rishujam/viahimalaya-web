# ViaHimalaya Trek Data API

This directory contains the database migration scripts and documentation for the ViaHimalaya trek data upload API.

## Database Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Neon Database Connection
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"

# Guide Authentication Secret
GUIDE_SECRET="your-secure-secret-key-here"
```

### 2. Run Database Migration

Execute the migration script to create the required tables:

```bash
# Connect to your Neon database and run:
psql $DATABASE_URL -f database/migrations/001_create_trek_tables.sql
```

Or use the Neon SQL Editor in their dashboard to run the contents of `001_create_trek_tables.sql`.

## API Usage

### Endpoint
```
POST /api/trek/upload
```

### Headers
```
Content-Type: application/json
x-guide-secret: your-guide-secret-here
```

### Request Body Format

```json
{
  "trek_meta": {
    "guide_id": "guide_123",
    "trek_name": "Triund Trek",
    "start_time": 1711696000,
    "end_time": 1711782400,
    "description": "Beautiful trek to Triund with stunning views",
    "difficulty_level": "moderate",
    "region": "Himachal Pradesh"
  },
  "points": [
    {
      "timestamp": 1711696000,
      "lat": 31.1048,
      "lon": 77.1734,
      "alt_gps": 2240.5,
      "alt_baro": 2242.1,
      "accuracy_h": 3.2,
      "accuracy_v": 5.0,
      "sat_count": 14,
      "speed": 1.1,
      "bearing": 145.2,
      "battery": 88,
      "raw_sensors": {
        "accel_x": 0.02,
        "accel_y": 0.05,
        "accel_z": 9.81
      }
    }
  ]
}
```

### Response Format

#### Success (201 Created)
```json
{
  "success": true,
  "message": "Trek data uploaded successfully",
  "data": {
    "trek_id": "uuid-here",
    "points_uploaded": 1500,
    "upload_time": "2024-03-29T10:30:00.000Z"
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized: Invalid guide secret"
}
```

**400 Bad Request**
```json
{
  "error": "Missing required fields: trek_meta and points array"
}
```

**500 Internal Server Error**
```json
{
  "error": "Database tables not initialized. Please run the migration script."
}
```

## Data Model

### Treks Table
- `id`: UUID primary key
- `guide_id`: Guide identifier
- `trek_name`: Name of the trek
- `start_time`: Trek start timestamp
- `end_time`: Trek end timestamp (optional)
- `description`: Trek description
- `difficulty_level`: Difficulty rating
- `region`: Geographic region
- `metadata`: Additional data in JSON format
- `created_at`: Record creation time
- `updated_at`: Last update time

### Path Points Table
- `id`: UUID primary key
- `trek_id`: Foreign key to treks table
- `timestamp`: GPS point timestamp
- `lat`: Latitude (decimal degrees)
- `lon`: Longitude (decimal degrees)
- `alt_gps`: GPS altitude (meters)
- `alt_baro`: Barometric altitude (meters)
- `accuracy_h`: Horizontal accuracy (meters)
- `accuracy_v`: Vertical accuracy (meters)
- `sat_count`: Number of GPS satellites
- `speed`: Ground speed (m/s)
- `bearing`: Direction (degrees)
- `battery`: Battery percentage
- `raw_sensors`: Sensor data in JSON format
- `created_at`: Record creation time

## Performance Considerations

- The API processes GPS points in batches of 1000 for optimal performance
- Indexes are created on frequently queried columns
- Large uploads (5000+ points) are handled efficiently with concurrent inserts
- The `trek_summaries` view provides quick access to trek statistics

## Security

- Authentication is handled via the `x-guide-secret` header
- All database operations use parameterized queries to prevent SQL injection
- Input validation ensures data integrity
- Error messages don't expose sensitive system information

## Testing

You can test the API using curl:

```bash
curl -X POST http://localhost:3000/api/trek/upload \
  -H "Content-Type: application/json" \
  -H "x-guide-secret: your-secret-here" \
  -d @test-data.json
```

Where `test-data.json` contains a sample payload with trek metadata and GPS points.