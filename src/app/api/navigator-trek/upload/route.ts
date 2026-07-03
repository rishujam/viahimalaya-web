import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// TypeScript interfaces matching your Kotlin data classes
interface RawSensors {
  accelerometerX?: number | null;
  accelerometerY?: number | null;
  accelerometerZ?: number | null;
  gyroscopeX?: number | null;
  gyroscopeY?: number | null;
  gyroscopeZ?: number | null;
  magnetometerX?: number | null;
  magnetometerY?: number | null;
  magnetometerZ?: number | null;
  pressure?: number | null;
}

interface Point {
  lat: number;
  lon: number;
  timestamp: number;
  altGps?: number | null;
  altBaro?: number | null;
  accuracyH?: number | null;
  accuracyV?: number | null;
  speed?: number | null;
  bearing?: number | null;
  battery?: number | null;
  rawSensors?: RawSensors | null;
}

interface NavigatorTrek {
  id: string;
  user: string;
  trekId: string;
  points?: Point[] | null;
}

export async function POST(request: NextRequest) {
  // Validate API key
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${process.env.INTERNAL_API_KEY}`;
  
  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Unauthorized: Invalid or missing API key' 
      },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const navigatorTrek: NavigatorTrek = body;

    // Validate required fields
    if (!navigatorTrek.id || !navigatorTrek.user || !navigatorTrek.trekId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: id, user, and trekId are required'
        },
        { status: 400 }
      );
    }

    // Validate points array if provided
    if (navigatorTrek.points && !Array.isArray(navigatorTrek.points)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid points field: must be an array'
        },
        { status: 400 }
      );
    }

    // Validate each point has required fields
    if (navigatorTrek.points && navigatorTrek.points.length > 0) {
      for (let i = 0; i < navigatorTrek.points.length; i++) {
        const point = navigatorTrek.points[i];
        if (
          typeof point.lat !== 'number' ||
          typeof point.lon !== 'number' ||
          typeof point.timestamp !== 'number'
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid point at index ${i}: lat, lon, and timestamp are required and must be numbers`
            },
            { status: 400 }
          );
        }

        // Validate lat/lon ranges
        if (point.lat < -90 || point.lat > 90) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid latitude at point ${i}: must be between -90 and 90`
            },
            { status: 400 }
          );
        }

        if (point.lon < -180 || point.lon > 180) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid longitude at point ${i}: must be between -180 and 180`
            },
            { status: 400 }
          );
        }
      }
    }

    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!);

    // Insert navigator_trek record
    const navigatorTrekResult = await sql`
      INSERT INTO navigator_treks (
        id, user_id, trek_id, created_at
      ) VALUES (
        ${navigatorTrek.id},
        ${navigatorTrek.user},
        ${navigatorTrek.trekId},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        trek_id = EXCLUDED.trek_id,
        updated_at = NOW()
      RETURNING id
    `;

    const insertedTrekId = navigatorTrekResult[0].id;

    // Insert points if provided
    let insertedPointsCount = 0;
    if (navigatorTrek.points && navigatorTrek.points.length > 0) {
      // Delete existing points for this trek (in case of re-upload)
      await sql`DELETE FROM points WHERE navigator_trek_id = ${insertedTrekId}`;

      // Insert points individually (simpler and more reliable)
      for (const point of navigatorTrek.points) {
        const rawSensorsJson = point.rawSensors ? JSON.stringify(point.rawSensors) : null;

        await sql`
          INSERT INTO points (
            navigator_trek_id, lat, lon, timestamp, alt_gps, alt_baro,
            accuracy_h, accuracy_v, speed, bearing, battery,
            raw_sensors, created_at
          ) VALUES (
            ${insertedTrekId},
            ${point.lat},
            ${point.lon},
            ${point.timestamp},
            ${point.altGps ?? null},
            ${point.altBaro ?? null},
            ${point.accuracyH ?? null},
            ${point.accuracyV ?? null},
            ${point.speed ?? null},
            ${point.bearing ?? null},
            ${point.battery ?? null},
            ${rawSensorsJson}::jsonb,
            NOW()
          )
        `;

        insertedPointsCount++;
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: insertedTrekId,
          user: navigatorTrek.user,
          trekId: navigatorTrek.trekId,
          pointsCount: insertedPointsCount,
          message: 'Navigator trek uploaded successfully'
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Navigator trek upload error:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      // Foreign key violation
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Referenced trek does not exist'
          },
          { status: 400 }
        );
      }

      // Table doesn't exist
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database tables not found. Please run migrations first.'
          },
          { status: 500 }
        );
      }

      // Permission denied
      if (error.message.includes('permission denied')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database permission denied'
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during navigator trek upload'
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to upload navigator trek data.'
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to upload navigator trek data.'
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to upload navigator trek data.'
    },
    { status: 405 }
  );
}
