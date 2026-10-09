'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { Tab, Tabs } from '@mui/material';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { useAuth } from '@msflib/react-auth';
import FormBuilder from '@/dynamics/FormBuilder';
import { ROUTES } from '@/constant/routes.constant';
import { useDashboardDestination } from '@/hooks/provider.hooks';
import {
  SEGMENTED_TABS_CLASS,
  segmentedTabSx,
  segmentedTabsSx,
} from '@/styles/tabs.styles';
import { RegisterFormValues, SignUpAs } from '@/types/auth.types';
import { withNext } from '@/utils/redirect.utils';
import { AuthHeader, AuthOption } from '../../components/Reusables';
import { registerFormElements } from '../data/form/register.form';
import { RegisterLayout } from '../data/form/register.layout';

const TABS: { value: SignUpAs; label: string; icon: React.ReactElement }[] = [
  { value: 'client', label: 'Client', icon: <PersonOutlineOutlined /> },
  { value: 'provider', label: 'Provider', icon: <StorefrontOutlined /> },
];

const SUBTITLE: Record<SignUpAs, string> = {
  client: 'Book local help, follow each booking and leave reviews.',
  provider:
    'Create your account, then set up your business to publish services.',
};

const tabId = (as: SignUpAs) => `signup-tab-${as}`;
const PANEL_ID = 'signup-panel';

export default function SignUp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const as: SignUpAs =
    searchParams.get('as') === 'provider' ? 'provider' : 'client';
  const next =
    as === 'provider' ? ROUTES.provider.onboard : searchParams.get('next');
  const { register, login, loading } = useAuth();
  const dashboardDestination = useDashboardDestination();
  const [formData, setFormData] = useState<Partial<RegisterFormValues>>({});

  const setAs = (value: SignUpAs) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'provider') params.set('as', value);
    else params.delete('as');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  // MSFLib `/open` creates the account without issuing a token, so log in right after.
  // Provider is not an account type (ADR 0004): it only sends the user to onboarding.
  const handleSubmit = async ({
    username,
    email,
    password,
  }: RegisterFormValues) => {
    try {
      await register({ username, email, password });
    } catch {
      toast.error(
        'Could not create your account. The email or username may be taken.'
      );
      return;
    }
    try {
      await login({ email, password });
      toast.success(
        as === 'provider'
          ? 'Account created. Now set up your business.'
          : 'Account created.'
      );
      router.replace(await dashboardDestination(next));
    } catch {
      toast.info('Account created. Log in to continue.');
      router.replace(withNext(ROUTES.login, next));
    }
  };

  return (
    <div>
      <AuthHeader title="Create an Account" subtitle={SUBTITLE[as]} />
      <div className="mb-6 flex justify-center">
        <Tabs
          value={as}
          onChange={(_, value: SignUpAs) => setAs(value)}
          aria-label="Sign up as"
          className={SEGMENTED_TABS_CLASS}
          sx={segmentedTabsSx}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              id={tabId(tab.value)}
              aria-controls={as === tab.value ? PANEL_ID : undefined}
              sx={segmentedTabSx}
            />
          ))}
        </Tabs>
      </div>
      <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(as)}>
        <FormBuilder
          elements={registerFormElements}
          layout={RegisterLayout}
          formData={formData}
          setFormData={setFormData}
          loadingState={loading.register || loading.login}
          onSubmit={handleSubmit}
        />
      </div>
      <AuthOption
        title="Already have an account?"
        linkText="Log In"
        linkHref={withNext(ROUTES.login, next)}
      />
    </div>
  );
}
