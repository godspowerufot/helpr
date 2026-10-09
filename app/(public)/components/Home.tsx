import Link from 'next/link';
import type { SvgIconComponent } from '@mui/icons-material';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import HomeRepairServiceOutlined from '@mui/icons-material/HomeRepairServiceOutlined';
import MapOutlined from '@mui/icons-material/MapOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import AppPaymentNotice from '@/components/AppPaymentNotice';
import { ROUTES } from '@/constant/routes.constant';
import PillLink from '@/components/PillLink';
import Reveal from '@/components/Reveal';
import { CONTAINER, GLASS_CARD, ICON_TILE } from '@/styles/glass.styles';
import HeroSecondary from './landing/HeroSecondary';
import MsflibLine from './landing/MsflibLine';

type Item = { title: string; body: string; Icon: SvgIconComponent };

const STEPS: Item[] = [
  {
    title: 'Find',
    body: 'Search services and prices in Eket.',
    Icon: SearchOutlined,
  },
  {
    title: 'Request',
    body: 'Pick a time and send the request.',
    Icon: EventAvailableOutlined,
  },
  {
    title: 'Pay',
    body: 'Check out with Paystack in test mode.',
    Icon: PaymentsOutlined,
  },
  {
    title: 'Review',
    body: 'Rate the job once it’s done.',
    Icon: RateReviewOutlined,
  },
];

type Product = Item & { href: string; cta: string };

const FEATURED: Product = {
  title: 'Browse Services',
  body: 'Cleaning, plumbing, electrical work, tutoring, hair and moving. Compare prices, ratings and areas from providers in Eket.',
  Icon: HomeRepairServiceOutlined,
  href: ROUTES.services,
  cta: 'Open Services',
};

const PRODUCTS: Product[] = [
  {
    title: 'Nearby Map',
    body: 'See providers around you on Google Maps and pick the closest one.',
    Icon: MapOutlined,
    href: ROUTES.servicesMap,
    cta: 'Open Map',
  },
  {
    title: 'Your Account',
    body: 'One account to request bookings, follow their status and leave reviews.',
    Icon: PersonOutlineOutlined,
    href: ROUTES.register,
    cta: 'Create Account',
  },
  {
    title: 'For Providers',
    body: 'Publish what you offer with a clear price and area, then accept the requests you want.',
    Icon: StorefrontOutlined,
    href: ROUTES.registerProvider,
    cta: 'Get Started',
  },
];

const SECTION = 'flex min-h-dvh snap-start items-center py-24 lg:py-28';

function ProductCard({
  product: { title, body, Icon, href, cta },
  featured = false,
}: {
  product: Product;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${GLASS_CARD} group flex h-full flex-col gap-6 p-6 transition-[background-color] duration-200 hover:bg-glass/60 sm:p-8 ${featured ? 'md:min-h-64' : ''}`}
    >
      <span className={ICON_TILE}>
        <Icon aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-2">
        <span className={featured ? 'l-h3 text-ink' : 'h5-b text-ink'}>
          {title}
        </span>
        <span className="b2-r max-w-[60ch] text-pretty text-ink/65">
          {body}
        </span>
      </span>
      <span className="b2-m mt-auto self-end text-ink">
        {cta}{' '}
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        >
          ↗
        </span>
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <section id="top" className={`${SECTION} justify-center pt-28`}>
        <div className={`${CONTAINER} flex flex-col items-center text-center`}>
          <p className="f1-m rounded-full border border-glass/70 bg-glass/50 px-3 py-1 text-ink/70 backdrop-blur-md">
            Local services in Eket
          </p>
          <h1 className="l-h1 mt-6 max-w-[14ch] text-balance">
            Local Help, Booked in One Place
          </h1>
          <p className="b1-r mt-6 max-w-[52ch] text-pretty text-ink/70">
            Find a cleaner, plumber, electrician or tutor near you. Request a
            time, pay through Paystack in test mode, and review the job when
            it’s done.
          </p>
          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <PillLink
              variant="arrow"
              href={ROUTES.services}
              className="w-full sm:w-auto"
            >
              Browse Services
            </PillLink>
            <HeroSecondary />
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className={SECTION}
      >
        <div className={CONTAINER}>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2 id="how-heading" className="l-h2 text-balance">
              One Request. One Record. Paid When It’s Done.
            </h2>
            <p className="b1-r mt-6 max-w-[60ch] text-pretty text-ink/70">
              Browse without an account, request a time, and pay only after the
              provider accepts. Providers publish what they offer and take
              requests in one list. Every step stays on the booking, so nobody
              chases messages.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <PillLink href={ROUTES.services}>
                Browse Services <span aria-hidden="true">→</span>
              </PillLink>
              <PillLink variant="glass" href={ROUTES.servicesMap}>
                See the Map
              </PillLink>
            </div>
          </Reveal>

          <Reveal className="mt-14">
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ title, body, Icon }, index) => (
                <li
                  key={title}
                  className={`${GLASS_CARD} flex flex-col gap-8 p-6`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={ICON_TILE}>
                      <Icon aria-hidden="true" />
                    </span>
                    <span
                      aria-hidden="true"
                      className="l-num tabular-nums text-ink/15"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <h3 className="h5-b text-ink">{title}</h3>
                    <p className="b2-r mt-1 text-ink/65">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex justify-center text-center">
              <AppPaymentNotice />
            </div>
          </Reveal>
        </div>
      </section>

      <section
        id="the-line"
        aria-labelledby="line-heading"
        className={SECTION}
      >
        <div className={CONTAINER}>
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2 id="line-heading" className="l-h2 text-balance">
              Every Request Travels This Line
            </h2>
            <p className="b1-r mt-6 max-w-[62ch] text-pretty text-ink/70">
              Helpr moves work through MSFLib the way a supply line moves
              goods. Select a station to see the package, the screen that
              calls it, and the MSFLib surface it uses.
            </p>
          </Reveal>
          <Reveal>
            <MsflibLine />
          </Reveal>
        </div>
      </section>

      <section id="offer" aria-labelledby="offer-heading" className={SECTION}>
        <div className={CONTAINER}>
          <Reveal>
            <h2
              id="offer-heading"
              className="l-h2 mx-auto max-w-[20ch] text-balance text-center"
            >
              Everything a Booking Needs
            </h2>
          </Reveal>
          <Reveal className="mt-12">
            <ul className="grid gap-4 md:grid-cols-3">
              <li className="md:col-span-3">
                <ProductCard product={FEATURED} featured />
              </li>
              {PRODUCTS.map((product) => (
                <li key={product.title}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
