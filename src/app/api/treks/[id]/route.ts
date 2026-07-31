import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Trek } from '@/types/trek';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication check
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${process.env.INTERNAL_API_KEY}`;
  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    // Await params in Next.js 15+
    const { id: trekId } = await params;

    // Validate that ID is provided
    if (!trekId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trek ID is required'
        },
        { status: 400 }
      );
    }

    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!);

    // Query single trek by ID from the treks table
    const result = await sql`
      SELECT
        id,
        name,
        location,
        distance,
        elevation,
        bounding_box,
        coordinate_url,
        image_url,
        poi_url,
        poi_updated_at,
        details_url,
        created_at
      FROM treks
      WHERE id = ${trekId}
    `;

    // Check if trek was found
    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trek not found with the provided ID'
        },
        { status: 404 }
      );
    }

    // Transform the result to ensure proper typing
    const trek: Trek = {
      id: result[0].id,
      name: result[0].name,
      location: result[0].location,
      distance: result[0].distance,
      elevation: result[0].elevation,
      bounding_box: result[0].bounding_box,
      coordinate_url: result[0].coordinate_url,
      image_url: result[0].image_url,
      poi_url: result[0].poi_url ?? null,
      poi_updated_at: result[0].poi_updated_at ?? null,
      details_url: result[0].details_url ?? null,
      created_at: result[0].created_at
    };

    // Return success response with trek data
    return NextResponse.json({
      success: true,
      data: {
        trek: trek,
        retrieved_at: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Trek fetch error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      // Handle invalid UUID format
      if (error.message.includes('invalid input syntax for type uuid')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid trek ID format. Please provide a valid UUID.'
          },
          { status: 400 }
        );
      }

      // Handle table not found
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Treks table not found. Please ensure the table exists in the database.' 
          },
          { status: 500 }
        );
      }
      
      // Handle permission denied
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

    // Generic error response
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error while fetching trek details' 
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
      error: 'Method not allowed. Use GET to retrieve trek details.' 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed. Use GET to retrieve trek details.' 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed. Use GET to retrieve trek details.' 
    },
    { status: 405 }
  );
}
