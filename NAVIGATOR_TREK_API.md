# Navigator Trek Upload API

## Overview
This API endpoint allows uploading navigator trek data with GPS points and sensor information to the database.

## Endpoint
```
POST /api/navigator-trek/upload
```

## Authentication
Requires Bearer token authentication using the `INTERNAL_API_KEY` environment variable.

```
Authorization: Bearer YOUR_INTERNAL_API_KEY
```

## Request Body

### NavigatorTrek Model
```typescript
{
  id: string;           // Unique identifier for the navigator trek
  user: string;         // User/guide identifier
  trekId: string;       // Reference to the trek being navigated
  points?: Point[];     // Optional array of GPS tracking points
}
```

### Point Model
```typescript
{
  lat: number;              // Latitude (-90 to 90)
  lon: number;              // Longitude (-180 to 180)
  timestamp: number;        // Unix timestamp in milliseconds
  altGps?: number;          // GPS altitude in meters
  altBaro?: number;         // Barometric altitude in meters
  accuracyH?: number;       // Horizontal accuracy in meters
  accuracyV?: number;       // Vertical accuracy in meters
  speed?: number;           // Speed in m/s
  bearing?: number;         // Bearing in degrees (0-360)
  battery?: number;         // Battery percentage (0-100)
  rawSensors?: RawSensors;  // Raw sensor data
}
```

### RawSensors Model
```typescript
{
  accelerometerX?: number;
  accelerometerY?: number;
  accelerometerZ?: number;
  gyroscopeX?: number;
  gyroscopeY?: number;
  gyroscopeZ?: number;
  magnetometerX?: number;
  magnetometerY?: number;
  magnetometerZ?: number;
  pressure?: number;
}
```

## Example Request

### cURL
```bash
curl -X POST https://your-domain.com/api/navigator-trek/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_INTERNAL_API_KEY" \
  -d '{
    "id": "trek-123-uuid",
    "user": "user-456",
    "trekId": "manali-loop",
    "points": [
      {
        "lat": 32.2432,
        "lon": 77.1892,
        "timestamp": 1719945600000,
        "altGps": 2050.5,
        "altBaro": 2048.3,
        "accuracyH": 5.2,
        "accuracyV": 8.1,
        "speed": 1.2,
        "bearing": 45.0,
        "battery": 85,
        "rawSensors": {
          "accelerometerX": 0.12,
          "accelerometerY": -0.05,
          "accelerometerZ": 9.81,
          "gyroscopeX": 0.01,
          "gyroscopeY": -0.02,
          "gyroscopeZ": 0.00,
          "magnetometerX": 23.5,
          "magnetometerY": -12.3,
          "magnetometerZ": 45.6,
          "pressure": 1013.25
        }
      },
      {
        "lat": 32.2435,
        "lon": 77.1895,
        "timestamp": 1719945660000,
        "altGps": 2055.2,
        "battery": 84
      }
    ]
  }'
```

### JavaScript/TypeScript
```typescript
const response = await fetch('https://your-domain.com/api/navigator-trek/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
  },
  body: JSON.stringify({
    id: 'trek-123-uuid',
    user: 'user-456',
    trekId: 'manali-loop',
    points: [
      {
        lat: 32.2432,
        lon: 77.1892,
        timestamp: Date.now(),
        altGps: 2050.5,
        battery: 85
      }
    ]
  })
});

const result = await response.json();
console.log(result);
```

### Kotlin (Android)
```kotlin
data class NavigatorTrek(
    val id: String,
    val user: String,
    val trekId: String,
    val points: List<Point>? = null
)

data class Point(
    val lat: Double,
    val lon: Double,
    val timestamp: Long,
    val altGps: Double? = null,
    val altBaro: Double? = null,
    val accuracyH: Double? = null,
    val accuracyV: Double? = null,
    val speed: Double? = null,
    val bearing: Double? = null,
    val battery: Int? = null,
    val rawSensors: RawSensors? = null
)

// Upload function
suspend fun uploadNavigatorTrek(trek: NavigatorTrek) {
    val client = HttpClient()
    val response = client.post("https://your-domain.com/api/navigator-trek/upload") {
        header("Authorization", "Bearer $INTERNAL_API_KEY")
        contentType(ContentType.Application.Json)
        setBody(trek)
    }
    println(response.bodyAsText())
}
```

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "trek-123-uuid",
    "user": "user-456",
    "trekId": "manali-loop",
    "pointsCount": 2,
    "message": "Navigator trek uploaded successfully"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields: id, user, and trekId are required"
}
```

#### 400 Bad Request - Invalid Point Data
```json
{
  "success": false,
  "error": "Invalid point at index 0: lat, lon, and timestamp are required and must be numbers"
}
```

#### 400 Bad Request - Invalid Coordinates
```json
{
  "success": false,
  "error": "Invalid latitude at point 0: must be between -90 and 90"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing API key"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error during navigator trek upload"
}
```

## Features

### Upsert Behavior
- If a navigator trek with the same `id` already exists, it will be updated
- Existing points for that trek will be deleted and replaced with new points

### Data Validation
- Required fields: `id`, `user`, `trekId`
- Point validation: `lat`, `lon`, `timestamp` are required for each point
- Latitude range: -90 to 90
- Longitude range: -180 to 180

### Automatic Timestamps
- `start_time`: Calculated from the first point's timestamp
- `end_time`: Calculated from the last point's timestamp
- `created_at` and `updated_at`: Automatically managed by the database

## Database Schema

The API uses two tables:

### navigator_treks
- `id` (UUID): Primary key
- `guide_id` (VARCHAR): User identifier (maps to `user` field)
- `trek_name` (VARCHAR): Trek identifier (maps to `trekId` field)
- `start_time` (TIMESTAMP): Start time from first point
- `end_time` (TIMESTAMP): End time from last point
- `metadata` (JSONB): Additional metadata
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

### path_points
- `id` (UUID): Primary key
- `trek_id` (UUID): Foreign key to navigator_treks
- `timestamp` (TIMESTAMP): Point timestamp
- `lat`, `lon` (DECIMAL): Coordinates
- `alt_gps`, `alt_baro` (DECIMAL): Altitude data
- `accuracy_h`, `accuracy_v` (DECIMAL): Accuracy metrics
- `speed`, `bearing` (DECIMAL): Movement data
- `battery` (INTEGER): Battery level
- `raw_sensors` (JSONB): Sensor data
- `created_at` (TIMESTAMP): Audit timestamp

## Notes

- All optional fields can be `null` or omitted
- Timestamps should be in milliseconds (Unix epoch)
- The API handles timezone conversions automatically
- Large trek uploads with many points may take longer to process
- Consider chunking very large treks (>10,000 points) into multiple uploads
