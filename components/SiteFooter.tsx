import Link from 'next/link';
import { ROUTES } from '@/constant/routes.constant';
import { CONTAINER, GLASS_CARD } from '@/styles/glass.styles';
import SiteMark from './SiteMark';

const LINKS = [
  { label: 'Services', href: ROUTES.services },
  { label: 'Map', href: ROUTES.servicesMap },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'The Line', href: '/#the-line' },
];

export default function SiteFooter() {
  return (
    <footer className="pb-8">
      <div className={CONTAINER}>
        <div
          className={`${GLASS_CARD} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
        >
          <div className="flex items-center gap-3">
            <SiteMark />
            <p className="f1-r text-ink/60">
              © 2026 <span translate="no">Helpr</span>. Checkout uses Paystack
              in test mode.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="b2-r inline-flex min-h-11 items-center text-ink/70 transition-colors duration-200 hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
