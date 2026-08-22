import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

/**
 * Remote config, fetched once per app launch.
 *
 * DELIBERATELY UNAUTHENTICATED - see 006_create_app_config.sql for why, and for
 * the rule that follows from it: everything in this response is public.
 *
 * Cached at the CDN rather than through Next's cache. open-next.config.ts sets
 * incrementalCache and tagCache to "dummy", so `export const revalidate` and
 * `dynamic = 'force-static'` do nothing useful in this deployment; response
 * headers are how the other read routes cache, and this follows them.
 *
 * The caching is not a nicety here. With no API key in front of it, an
 * uncached route would put one Neon query on the end of every request anyone
 * cared to send.
 */
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const rows = await sql`
      SELECT key, value
      FROM app_config
      WHERE is_enabled = TRUE
    `;

    // Assembled straight from the rows: the table's keys are the response's
    // keys. A disabled or missing row simply does not appear, and the client
    // reads an absent section as "feature off" - so retiring the banner is an
    // UPDATE, not a release.
    const config: Record<string, unknown> = {};
    for (const row of rows) {
      config[row.key as string] = row.value;
    }

    // Wrapped in the { success, data } envelope every other route uses, so the
    // app can reuse VResponse<T> rather than special-casing this one endpoint.
    return NextResponse.json({ success: true, data: config }, {
      status: 200,
      headers: {
        // Matches /api/treks/search. Five minutes means switching a key off
        // reaches everyone within five minutes, while Neon sees at most one
        // query per interval per edge location.
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('App config fetch error:', error);

    // An empty config, not a 500.
    //
    // Every section is optional and absence already means "off", so an empty
    // config is a valid answer the client knows how to handle. Returning an
    // error instead would give the app a failure to report on a screen the
    // user did not ask anything of. The banner not appearing is the correct
    // degradation; a toast about config is not.
    return NextResponse.json({ success: true, data: {} }, {
      status: 200,
      headers: {
        // Short, so a database blip does not pin an empty config at the edge
        // for the full five minutes.
        'Cache-Control': 'public, s-maxage=30'
      }
    });
  }
}
