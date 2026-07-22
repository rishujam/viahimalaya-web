import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Trek } from '@/types/trek';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${process.env.INTERNAL_API_KEY}`;
  
  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validate search query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query parameter "q" is required'
        },
        { status: 400 }
      );
    }

    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!);
    
    // Search for treks with name containing the query (case-insensitive)
    const searchPattern = `%${query.trim()}%`;
    
    const treks = await sql`
      SELECT
        id, name, location, distance, elevation,
        bounding_box, coordinate_url, image_url, created_at
      FROM treks
      WHERE name ILIKE ${searchPattern}
      ORDER BY name ASC
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
      image_url: trek.image_url,
      created_at: trek.created_at
    }));
    
    // Return success response with search results
    return NextResponse.json({
      success: true,
      data: {
        query: query.trim(),
        count: formattedTreks.length,
        treks: formattedTreks,
        searched_at: new Date().toISOString()
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Trek search error:', error);
    
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
        error: 'Internal server error while searching treks'
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
      error: 'Method not allowed. Use GET to search treks.' 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed. Use GET to search treks.' 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed. Use GET to search treks.' 
    },
    { status: 405 }
  );
}
