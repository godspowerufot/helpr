'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@msflib/react-auth';
import { ROUTES } from '@/constant/routes.constant';
import { useMyProviders } from '@/hooks/provider.hooks';
import {
  customerLinks,
  NavLink,
  onboardLink,
  providerLinks,
} from '../data/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavGroup({
  title,
  links,
  pathname,
  onNavigate,
}: {
  title: string;
  links: NavLink[];
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = (link: NavLink) =>
    link.exact
      ? pathname === link.href
      : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <div>
      <p className="f1-m px-3 pb-2 uppercase tracking-wide text-text-light">
        {title}
      </p>
      <ul className="flex flex-col gap-1">
        {links.map((link) => {
          const active = isActive(link);
          const Icon = link.icon;
          return (
            <li key={link.id}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                className={`b2-m flex min-h-11 items-center gap-3 rounded-standard px-3 transition-colors duration-150 ${
                  active
                    ? 'bg-primary-light text-text'
                    : 'text-text-light hover:bg-background-light hover:text-text'
                }`}
              >
                <Icon fontSize="small" aria-hidden="true" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  const { status } = useAuth();
  const { data: businesses, isLoading } = useMyProviders(
    status === 'authenticated'
  );
  const isProvider = (businesses?.length ?? 0) > 0;

  return (
    <>
      {isOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-neutral/50 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        aria-label="App navigation"
        className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-stroke-light bg-glass/80 backdrop-blur-[18px] transition-[transform,visibility] duration-300 lg:static lg:visible lg:translate-x-0 lg:bg-glass/42 motion-reduce:transition-none ${
          isOpen ? 'translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-stroke-light px-6">
            <Link href={ROUTES.home} translate="no" className="h3-r text-text">
              Helpr
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
            <NavGroup
              title="Book Help"
              links={customerLinks}
              pathname={pathname}
              onNavigate={onClose}
            />
            {isLoading ? null : (
              <NavGroup
                title="Your Business"
                links={isProvider ? providerLinks : [onboardLink]}
                pathname={pathname}
                onNavigate={onClose}
              />
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
