import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Types for the incoming data
interface RawSensors {
  accel_x: number;
  accel_y: number;
  accel_z: number;
  [key: string]: any; // Allow additional sensor data
}

interface PathPoint {
  timestamp: number;
  lat: number;
  lon: number;
  alt_gps: number;
  alt_baro: number;
  accuracy_h: number;
  accuracy_v: number;
  sat_count: number;
  speed: number;
  bearing: number;
  battery: number;
  raw_sensors: RawSensors;
  [key: string]: any; // Add index signature for dynamic field access
}

interface TrekMeta {
  guide_id?: string;
  trek_name: string;
  start_time: number;
  end_time?: number;
  description?: string;
  difficulty_level?: string;
  region?: string;
  [key: string]: any; // Allow additional metadata
}

interface UploadPayload {
  trek_meta: TrekMeta;
  points: PathPoint[];
}

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const guideSecret = request.headers.get('x-guide-secret');
    if (!guideSecret || guideSecret !== process.env.GUIDE_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid guide secret' },
        { status: 401 }
      );
    }

    // Parse request body
    let payload: UploadPayload;
    try {
      payload = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!payload.trek_meta || !payload.points || !Array.isArray(payload.points)) {
      return NextResponse.json(
        { error: 'Missing required fields: trek_meta and points array' },
        { status: 400 }
      );
    }

    if (payload.points.length === 0) {
      return NextResponse.json(
        { error: 'Points array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate trek_meta required fields
    const { trek_meta } = payload;
    if (!trek_meta.trek_name || !trek_meta.start_time) {
      return NextResponse.json(
        { error: 'Missing required trek_meta fields: trek_name and start_time' },
        { status: 400 }
      );
    }

    // Validate each point has required fields
    const requiredPointFields = [
      'timestamp', 'lat', 'lon', 'alt_gps', 'alt_baro', 
      'accuracy_h', 'accuracy_v', 'sat_count', 'speed', 
      'bearing', 'battery', 'raw_sensors'
    ];

    for (let i = 0; i < payload.points.length; i++) {
      const point = payload.points[i];
      for (const field of requiredPointFields) {
        if (point[field] === undefined || point[field] === null) {
          return NextResponse.json(
            { error: `Missing required field '${field}' in point at index ${i}` },
            { status: 400 }
          );
        }
      }
    }

    // Execute database operations
    // Insert trek record first
    const trekResult = await sql`
      INSERT INTO treks (
        guide_id, trek_name, start_time, end_time, description,
        difficulty_level, region, metadata, created_at
      ) VALUES (
        ${trek_meta.guide_id || null},
        ${trek_meta.trek_name},
        to_timestamp(${trek_meta.start_time}),
        ${trek_meta.end_time ? sql`to_timestamp(${trek_meta.end_time})` : null},
        ${trek_meta.description || null},
        ${trek_meta.difficulty_level || null},
        ${trek_meta.region || null},
        ${JSON.stringify(trek_meta)},
        NOW()
      ) RETURNING id
    `;

    const trekId = trekResult[0].id;

    // Bulk insert path points if any exist
    let pointsInserted = 0;
    if (payload.points.length > 0) {
      // For better performance with large datasets, we'll batch the inserts
      const batchSize = 1000;
      const batches = [];
      
      for (let i = 0; i < payload.points.length; i += batchSize) {
        batches.push(payload.points.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        // Build individual insert statements for this batch
        const insertPromises = batch.map(point =>
          sql`
            INSERT INTO path_points (
              trek_id, timestamp, lat, lon, alt_gps, alt_baro,
              accuracy_h, accuracy_v, sat_count, speed, bearing,
              battery, raw_sensors
            ) VALUES (
              ${trekId},
              to_timestamp(${point.timestamp}),
              ${point.lat},
              ${point.lon},
              ${point.alt_gps},
              ${point.alt_baro},
              ${point.accuracy_h},
              ${point.accuracy_v},
              ${point.sat_count},
              ${point.speed},
              ${point.bearing},
              ${point.battery},
              ${JSON.stringify(point.raw_sensors)}
            )
          `
        );

        // Execute all inserts in this batch concurrently
        await Promise.all(insertPromises);
        pointsInserted += batch.length;
      }
    }

    const result = { trekId, pointsCount: pointsInserted };

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Trek data uploaded successfully',
      data: {
        trek_id: result.trekId,
        points_uploaded: result.pointsCount,
        upload_time: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Trek upload error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database tables not initialized. Please run the migration script.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Duplicate data detected' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during trek upload' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload trek data.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload trek data.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload trek data.' },
    { status: 405 }
  );
}