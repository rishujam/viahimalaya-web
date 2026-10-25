'use client';

import { useActionState } from 'react';
import { motion } from 'framer-motion';
import { submitContactForm, initialContactFormState } from './actions';

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialContactFormState);

  if (state.status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <p className="text-vh-green-light text-lg font-sans font-medium">
          Thanks — we&apos;ve got your message.
        </p>
        <p className="text-white/60 mt-2 font-sans">We read every submission.</p>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="w-full max-w-lg flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-white/70 font-sans">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 font-sans focus:outline-none focus:border-vh-green-light transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm text-white/70 font-sans">
          What trek should we add, or what&apos;s on your mind?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          placeholder="Tell us about a trek you want on the app, a bug you hit, or anything else."
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 font-sans focus:outline-none focus:border-vh-green-light transition-colors resize-none"
        />
      </div>

      {state.status === 'error' && (
        <p className="text-red-400 text-sm font-sans" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-white/20 transition-all duration-300 font-medium font-sans px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
