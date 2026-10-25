'use server';

import { neon } from '@neondatabase/serverless';

// Mirrors the CHECK constraint in database/migrations/007_create_feedback.sql.
const MAX_FEEDBACK_CHARS = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactFormState {
  status: 'idle' | 'success' | 'error';
  error?: string;
}

export const initialContactFormState: ContactFormState = { status: 'idle' };

/**
 * Writes into the same `feedback` table the mobile app's "request a trek"
 * banner uses (see migration 007) - this is just a second front door onto it,
 * not a new identity or trust model. Runs server-side, so DATABASE_URL never
 * reaches the browser; unlike the mobile app this form has no INTERNAL_API_KEY
 * to present, which is fine since a Server Action is already first-party.
 */
export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();

  if (!EMAIL_PATTERN.test(email)) {
    return { status: 'error', error: 'Enter a valid email address.' };
  }
  if (!message) {
    return { status: 'error', error: 'Message cannot be empty.' };
  }
  if (message.length > MAX_FEEDBACK_CHARS) {
    return { status: 'error', error: `Message must be ${MAX_FEEDBACK_CHARS} characters or fewer.` };
  }

  const feedbackId = `${email}/${Date.now()}`;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO feedback (feedback_id, feedback)
      VALUES (${feedbackId}, ${message})
      ON CONFLICT (feedback_id) DO NOTHING
    `;
    return { status: 'success' };
  } catch (error) {
    console.error('Contact form submit error:', error);
    return { status: 'error', error: 'Something went wrong on our end. Please try again later.' };
  }
}
