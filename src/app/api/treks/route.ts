import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Trek } from '@/types/trek';

// Constants
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_PAGE = 1;

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
    
    // Parse and validate pagination parameters
    const page = Math.max(
      parseInt(searchParams.get('page') || '1'),
      MIN_PAGE
    );
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)), 1),
      MAX_LIMIT
    );
    const offset = (page - 1) * limit;
    
    // Shuffle parameters
    const shuffle = searchParams.get('shuffle') !== 'false'; // Default: true
    let seed = searchParams.get('seed');
    
    // Generate new seed if shuffle is enabled and no seed provided
    if (shuffle && !seed) {
      seed = generateSeed();
    }
    
    // Optional filters
    const location = searchParams.get('location');
    const minDistance = searchParams.get('min_distance');
    const maxDistance = searchParams.get('max_distance');
    
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL!);
    
    // Set random seed for consistent shuffling
    if (shuffle && seed) {
      await sql`SELECT setseed(${hashSeedToFloat(seed)})`;
    }
    
    // Fetch treks with pagination and filters
    let treks;
    let countResult;
    
    if (location || minDistance || maxDistance) {
      // With filters
      const locationPattern = location ? `%${location}%` : null;
      const minDist = minDistance ? parseFloat(minDistance) : null;
      const maxDist = maxDistance ? parseFloat(maxDistance) : null;
      
      if (shuffle) {
        treks = await sql`
          SELECT
            id, name, location, distance, elevation,
            bounding_box, coordinate_url, created_at
          FROM treks
          WHERE
            (${locationPattern}::text IS NULL OR location ILIKE ${locationPattern})
            AND (${minDist}::numeric IS NULL OR distance >= ${minDist})
            AND (${maxDist}::numeric IS NULL OR distance <= ${maxDist})
          ORDER BY random()
          LIMIT ${limit}
          OFFSET ${offset}
        `;
        
        countResult = await sql`
          SELECT COUNT(*) as count FROM treks
          WHERE
            (${locationPattern}::text IS NULL OR location ILIKE ${locationPattern})
            AND (${minDist}::numeric IS NULL OR distance >= ${minDist})
            AND (${maxDist}::numeric IS NULL OR distance <= ${maxDist})
        `;
      } else {
        treks = await sql`
          SELECT
            id, name, location, distance, elevation,
            bounding_box, coordinate_url, created_at
          FROM treks
          WHERE
            (${locationPattern}::text IS NULL OR location ILIKE ${locationPattern})
            AND (${minDist}::numeric IS NULL OR distance >= ${minDist})
            AND (${maxDist}::numeric IS NULL OR distance <= ${maxDist})
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
        
        countResult = await sql`
          SELECT COUNT(*) as count FROM treks
          WHERE
            (${locationPattern}::text IS NULL OR location ILIKE ${locationPattern})
            AND (${minDist}::numeric IS NULL OR distance >= ${minDist})
            AND (${maxDist}::numeric IS NULL OR distance <= ${maxDist})
        `;
      }
    } else {
      // No filters
      if (shuffle) {
        treks = await sql`
          SELECT
            id, name, location, distance, elevation,
            bounding_box, coordinate_url, created_at
          FROM treks
          ORDER BY random()
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        treks = await sql`
          SELECT
            id, name, location, distance, elevation,
            bounding_box, coordinate_url, created_at
          FROM treks
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }
      
      countResult = await sql`SELECT COUNT(*) as count FROM treks`;
    }
    
    const totalCount = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
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
    
    // Build pagination metadata
    const pagination = {
      page,
      limit,
      total: totalCount,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
      ...(shuffle && seed ? { seed } : {})
    };
    
    // Return success response with treks data
    return NextResponse.json({
      success: true,
      data: {
        treks: formattedTreks,
        pagination,
        retrieved_at: new Date().toISOString()
      }
    }, {
      status: 200,
      headers: {
        // Cache first page for 5 minutes, others for 1 hour
        'Cache-Control': page === 1
          ? 'public, s-maxage=300, stale-while-revalidate=600'
          : 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });

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

// Helper Functions

/**
 * Generate a random seed string
 */
function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Convert seed string to float between -1 and 1 for PostgreSQL setseed()
 */
function hashSeedToFloat(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Normalize to range [-1, 1]
  return ((hash % 1000000) / 1000000);
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