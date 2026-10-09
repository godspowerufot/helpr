import SiteShell from '@/components/SiteShell';
import { SITE_MAIN_ID } from '@/constant/site.constant';
import Home from './components/Home';
import LandingFooter from './components/landing/LandingFooter';

export default function PublicHomePage() {
  return (
    <div className="helpr-landing">
      <SiteShell>
        <main id={SITE_MAIN_ID}>
          <Home />
        </main>
        <LandingFooter />
      </SiteShell>
    </div>
  );
}
