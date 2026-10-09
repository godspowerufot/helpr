import SiteFooter from '@/components/SiteFooter';
import SiteShell from '@/components/SiteShell';
import { SITE_MAIN_ID } from '@/constant/site.constant';
import { CONTAINER } from '@/styles/glass.styles';

export default function ServicesFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteShell>
      <main id={SITE_MAIN_ID} className="min-h-dvh pt-28 pb-16 sm:pt-32">
        <div className={CONTAINER}>{children}</div>
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
