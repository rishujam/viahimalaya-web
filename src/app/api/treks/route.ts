import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Type definition for Trek item based on your database schema
interface Trek {
  id: string;
  name: string;
  location: string;
  distance: string;
  elevation: string;
  bounding_box: number[];
  coordinate_url: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!);

    // Query all treks from the treks table
    const treks = await sql`
      SELECT 
        id,
        name,
        location,
        distance,
        elevation,
        bounding_box,
        coordinate_url,
        created_at
      FROM treks
      ORDER BY created_at DESC
    `;

    // Transform the results to ensure proper typing
    const formattedTreks: Trek[] = treks.map(trek => ({
      id: trek.id,
      name: trek.name,
      location: trek.location,
      distance: trek.distance,
      elevation: trek.elevation,
      bounding_box: trek.bounding_box,
      coordinate_url: trek.coordinate_url,
      created_at: trek.created_at
    }));

    // Return success response with treks data
    return NextResponse.json({
      success: true,
      data: {
        treks: formattedTreks,
        count: formattedTreks.length,
        retrieved_at: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Treks fetch error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Treks table not found. Please ensure the table exists in the database.' 
          },
          { status: 500 }
        );
      }
      
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
        error: 'Internal server error while fetching treks' 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed. Use GET to retrieve treks data.' 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed. Use GET to retrieve treks data.' 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed. Use GET to retrieve treks data.' 
    },
    { status: 405 }
  );
}