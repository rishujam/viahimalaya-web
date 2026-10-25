import Link from 'next/link';
import type { Metadata } from 'next';
import ViaHimalayaLogo from '@/components/ViaHimalayaLogo';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact — ViaHimalaya',
  description: 'Request a trek, report an issue, or share feedback with the ViaHimalaya team.',
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col">
      <header className="w-full px-4 sm:px-8 py-6 flex items-center justify-between">
        <Link href="/">
          <ViaHimalayaLogo size="small" showText={true} />
        </Link>
        <Link
          href="/"
          className="text-white/60 hover:text-white text-sm font-sans transition-colors"
        >
          ← Back home
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="text-center mb-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-sans mb-4">
            Request a trek, or tell us anything
          </h1>
          <p className="text-white/70 font-sans">
            We&apos;re a small team adding new Himalayan treks one at a time. Tell us which one
            you want next, or let us know about a bug, a missing trail, or an idea.
          </p>
        </div>
        <ContactForm />
      </main>
    </div>
  );
}
