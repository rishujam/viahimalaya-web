import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Mirrors the CHECK constraint in 007_create_feedback.sql.
const MAX_FEEDBACK_CHARS = 2000;
const MAX_FEEDBACK_ID_CHARS = 320;

// "<email>/<epochMillis>", built on the phone. Deliberately loose about the
// address - this is a shape check to keep junk out of a primary key, not an
// identity check. Nothing here proves the email is the caller's; see the
// migration for why that is acceptable for feedback and what to do about it
// when the app starts sending Firebase tokens.
const FEEDBACK_ID_PATTERN = /^[^\s/]+@[^\s/]+\.[^\s/]+\/[0-9]{10,16}$/;

interface FeedbackBody {
  feedbackId?: unknown;
  feedback?: unknown;
}

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Free-text feedback from inside the app.
 *
 * Authenticated with the shared INTERNAL_API_KEY like the read routes, not with
 * a Firebase token. That is a deliberate, temporary choice: the app has
 * getIdToken() but no request sends one yet, so requiring a token here would
 * ship a button that 401s. Swapping to verifyFirebaseToken is a small change on
 * this side once the app sends the header - and at that point the verified
 * `sub` should be stored rather than trusting the address in feedbackId.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${process.env.INTERNAL_API_KEY}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    let body: FeedbackBody;
    try {
      body = await request.json();
    } catch {
      return fail('Request body must be valid JSON', 400);
    }

    const feedbackId = typeof body.feedbackId === 'string' ? body.feedbackId.trim() : '';
    if (!feedbackId) {
      return fail('feedbackId is required', 400);
    }
    if (feedbackId.length > MAX_FEEDBACK_ID_CHARS) {
      return fail(`feedbackId must be ${MAX_FEEDBACK_ID_CHARS} characters or fewer`, 400);
    }
    if (!FEEDBACK_ID_PATTERN.test(feedbackId)) {
      return fail('feedbackId must look like email/epochMillis', 400);
    }

    const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
    if (!feedback) {
      return fail('feedback is required and cannot be empty', 400);
    }
    if (feedback.length > MAX_FEEDBACK_CHARS) {
      return fail(`feedback must be ${MAX_FEEDBACK_CHARS} characters or fewer`, 400);
    }

    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      INSERT INTO feedback (feedback_id, feedback)
      VALUES (${feedbackId}, ${feedback})
      ON CONFLICT (feedback_id) DO NOTHING
    `;

    // 200 whether the row was written or already existed.
    //
    // The phone builds feedback_id once and reuses it across retries, so a
    // repeat delivery is the same submission arriving twice, not a second
    // opinion. Answering 409 would make the client treat a success as a
    // failure - the exact trade 004 records for poi_reviews - and there is
    // nothing here the user could do about it.
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Feedback submit error:', error);

    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return fail('Feedback table not found. Run migration 007.', 500);
      }
      if (error.message.includes('permission denied')) {
        return fail('Database permission denied', 403);
      }
    }

    return fail('Internal server error while saving feedback', 500);
  }
}
