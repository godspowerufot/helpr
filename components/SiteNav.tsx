'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CloseRounded from '@mui/icons-material/CloseRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import { useAuth } from '@msflib/react-auth';
import { ROUTES } from '@/constant/routes.constant';
import { SITE_MAIN_ID, SITE_PAGE_ID } from '@/constant/site.constant';
import { useMyProviders } from '@/hooks/provider.hooks';
import { PILL_DARK, PILL_GLASS } from '@/styles/glass.styles';
import SiteMark from './SiteMark';

const LINKS = [
  { label: 'Services', href: ROUTES.services, path: ROUTES.services },
  { label: 'Map', href: ROUTES.servicesMap },
  { label: 'How It Works', href: '/#how-it-works', section: 'how-it-works' },
  { label: 'The Line', href: '/#the-line', section: 'the-line' },
  { label: 'What You Get', href: '/#offer', section: 'offer' },
  { label: 'Get Started', href: '/#start', section: 'start' },
];

const SECTIONS = LINKS.flatMap((link) => (link.section ? [link.section] : []));

export default function SiteNav() {
  const pathname = usePathname();
  const onHome = pathname === ROUTES.home;
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: businesses } = useMyProviders(signedIn);
  const dashboardHref = businesses?.length
    ? ROUTES.provider.dashboard
    : ROUTES.bookings.list;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!onHome) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
        else if (entries.some((entry) => entry.target.id === SECTIONS[0]))
          setActive(null);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome]);

  useEffect(() => {
    const page = document.getElementById(SITE_PAGE_ID);
    const root = document.documentElement;
    page?.toggleAttribute('inert', open);
    root.style.overflow = open ? 'hidden' : '';
    if (open) firstLinkRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      page?.removeAttribute('inert');
      root.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  const current = (link: (typeof LINKS)[number]) => {
    if (onHome)
      return link.section && link.section === active ? 'location' : undefined;
    return link.path && pathname.startsWith(link.path) ? 'page' : undefined;
  };

  return (
    <header className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 sm:inset-x-5 sm:top-5">
      <a
        href={`#${SITE_MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-glass"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 rounded-full border border-glass/60 bg-glass p-1.5 pl-3 shadow-glass md:bg-glass/25 md:shadow-none md:backdrop-blur-2xl">
        <Link
          href={onHome ? '#top' : ROUTES.home}
          onClick={close}
          className="flex min-h-11 items-center gap-2.5 rounded-full pr-2"
        >
          <SiteMark />
          <span translate="no" className="font-display text-2xl leading-none">
            Helpr
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={onHome && link.section ? `#${link.section}` : link.href}
                  aria-current={current(link)}
                  className="f1-m inline-flex min-h-11 items-center rounded-full px-3.5 text-ink/70 transition-[background-color,color] duration-200 hover:bg-glass/60 hover:text-ink aria-[current]:bg-glass/80 aria-[current]:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href={dashboardHref} className={`${PILL_DARK} max-sm:px-4`}>
              <SpaceDashboardOutlined fontSize="small" aria-hidden="true" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href={ROUTES.login}
                className={`${PILL_GLASS} max-md:hidden`}
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.register}
                className={`${PILL_DARK} max-md:hidden`}
              >
                Create Account
              </Link>
            </>
          )}
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
            className="flex size-11 items-center justify-center rounded-full bg-ink text-glass lg:hidden"
          >
            {open ? (
              <CloseRounded aria-hidden="true" />
            ) : (
              <MenuRounded aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-open={open}
        className="l-menu fixed inset-0 -z-10 flex flex-col overflow-y-auto overscroll-contain bg-glass px-5 pt-28 pb-[max(2.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <nav aria-label="Menu">
          <ul className="flex flex-col">
            {LINKS.map((link, index) => (
              <li key={link.href} className="border-b border-ink/10">
                <Link
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={onHome && link.section ? `#${link.section}` : link.href}
                  aria-current={current(link)}
                  onClick={close}
                  className="l-h2 flex min-h-16 items-center py-2"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-3 pt-10">
          {signedIn ? (
            <Link href={dashboardHref} onClick={close} className={PILL_DARK}>
              <SpaceDashboardOutlined fontSize="small" aria-hidden="true" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href={ROUTES.register}
                onClick={close}
                className={PILL_DARK}
              >
                Create Account
              </Link>
              <Link href={ROUTES.login} onClick={close} className={PILL_GLASS}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
