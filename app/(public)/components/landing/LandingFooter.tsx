import Link from 'next/link';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import { ROUTES } from '@/constant/routes.constant';
import PillLink from '@/components/PillLink';
import Reveal from '@/components/Reveal';
import SiteMark from '@/components/SiteMark';
import { CONTAINER, GLASS_CARD } from '@/styles/glass.styles';

const LINKS = [
  { label: 'Services', href: ROUTES.services },
  { label: 'Map', href: ROUTES.servicesMap },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'The Line', href: '#the-line' },
  { label: 'Sign In', href: ROUTES.login },
  { label: 'Create Account', href: ROUTES.register },
];

const MARQUEE_REPEAT = Array.from({ length: 6 }, (_, i) => i);

export default function LandingFooter() {
  return (
    <footer
      id="start"
      className="flex min-h-dvh snap-start items-center py-24 lg:py-28"
    >
      <div className={CONTAINER}>
        <Reveal>
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <div className="flex flex-col gap-8 p-6 sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:p-14">
              <h2 className="l-h2 max-w-[16ch] text-balance">
                Book Local Help in Eket.
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <PillLink variant="arrow" href={ROUTES.services}>
                  Browse Services
                </PillLink>
                <PillLink
                  variant="glass"
                  href={ROUTES.register}
                  className="min-h-12 px-6"
                >
                  Create Account
                </PillLink>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="l-marquee-mask overflow-hidden border-y border-glass/80 py-4"
            >
              <div className="l-marquee-track flex w-max">
                {[0, 1].map((copy) => (
                  <div key={copy} className="flex shrink-0">
                    {MARQUEE_REPEAT.map((i) => (
                      <span
                        key={i}
                        className="l-marquee whitespace-nowrap px-8 text-ink/85"
                      >
                        Helpr <span className="text-ink/25">·</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-14">
              <div className="max-w-sm">
                <Link
                  href="#top"
                  className="inline-flex min-h-11 items-center gap-2.5 rounded-full pr-2"
                >
                  <SiteMark />
                  <span
                    translate="no"
                    className="font-display text-2xl leading-none"
                  >
                    Helpr
                  </span>
                </Link>
                <p className="b2-r mt-3 text-pretty text-ink/65">
                  A marketplace for local services in Eket. Checkout uses
                  Paystack in test mode.
                </p>
              </div>
              <nav aria-label="Footer">
                <ul className="grid grid-cols-2 gap-x-10 sm:grid-cols-3">
                  {LINKS.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group b2-r inline-flex min-h-11 items-center gap-1 text-ink/70 transition-colors duration-200 hover:text-ink"
                      >
                        {link.label}
                        <span
                          aria-hidden="true"
                          className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        >
                          ↗
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-glass/80 px-6 py-4 sm:px-10 lg:px-14">
              <p className="f1-r text-ink/60">
                © 2026 <span translate="no">Helpr</span>. Built on MSFLib.
              </p>
              <a
                href="#top"
                aria-label="Back to top"
                className="flex size-11 items-center justify-center rounded-full border border-glass/80 bg-glass/50 text-ink backdrop-blur-md transition-[background-color] duration-200 hover:bg-glass/80"
              >
                <ArrowUpwardRounded aria-hidden="true" fontSize="small" />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
