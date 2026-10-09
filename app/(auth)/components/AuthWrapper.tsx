import Image from 'next/image';
import SiteShell from '@/components/SiteShell';
import { SITE_MAIN_ID } from '@/constant/site.constant';
import { AUTH_IMAGE } from '@/data/image.data';
import { GLASS_CARD } from '@/styles/glass.styles';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <SiteShell>
      <main
        id={SITE_MAIN_ID}
        className="flex min-h-dvh items-center justify-center px-4 pt-28 pb-10 sm:px-8"
      >
        <div
          className={`${GLASS_CARD} grid w-full max-w-5xl overflow-hidden p-2 md:grid-cols-2`}
        >
          <div className="relative hidden min-h-[36rem] flex-col justify-end overflow-hidden rounded-card p-10 md:flex">
            <Image
              src={AUTH_IMAGE.src}
              alt={AUTH_IMAGE.alt}
              fill
              sizes="(min-width: 768px) 512px, 0px"
              className="object-cover grayscale"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: 'var(--scrim)' }}
            />
            <div className="relative text-on-primary">
              <span
                translate="no"
                className="f1-m inline-flex rounded-full border border-glass/40 bg-glass/15 px-3 py-1 backdrop-blur-md"
              >
                Helpr
              </span>
              <p className="d2 mt-4 max-w-md text-balance">
                Local Help, Booked in One Place
              </p>
              <p className="b2-r mt-3 max-w-md">
                Request a service, follow the booking, and leave a review when
                the job is done. Checkout uses Paystack in test mode.
              </p>
              <p className="f1-r mt-6 opacity-80">
                Photo:{' '}
                <a
                  href={AUTH_IMAGE.source}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  {AUTH_IMAGE.credit}
                </a>{' '}
                on Unsplash
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 sm:p-8 md:p-10">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
