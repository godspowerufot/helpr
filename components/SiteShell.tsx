import { SITE_PAGE_ID } from '@/constant/site.constant';
import SiteNav from './SiteNav';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <div id={SITE_PAGE_ID}>{children}</div>
    </>
  );
}
