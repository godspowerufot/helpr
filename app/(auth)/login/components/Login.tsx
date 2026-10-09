'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { LoginPayload, useAuth } from '@msflib/react-auth';
import FormBuilder from '@/dynamics/FormBuilder';
import { ROUTES } from '@/constant/routes.constant';
import { useDashboardDestination } from '@/hooks/provider.hooks';
import { withNext } from '@/utils/redirect.utils';
import { AuthHeader, AuthOption } from '../../components/Reusables';
import DemoAccounts from './DemoAccounts';
import GoogleCallback from './GoogleCallback';
import { loginFormElements } from '../data/form/login.form';
import { LoginLayout } from '../data/form/login.layout';

export default function Login() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const { login, loading } = useAuth();
  const dashboardDestination = useDashboardDestination();
  const [formData, setFormData] = useState<Partial<LoginPayload>>({});
  const [formKey, setFormKey] = useState(0);
  const [filledRole, setFilledRole] = useState<string | null>(null);

  const handleSubmit = (data: LoginPayload) => {
    login(data, {
      onSuccess: async () => {
        toast.success('Welcome back.');
        router.replace(await dashboardDestination(next));
      },
      onError: () => toast.error('Email or password is incorrect.'),
    }).catch(() => undefined);
  };

  const fillAccount = (email: string, password: string, role: string) => {
    setFormData({ email, password });
    setFormKey((key) => key + 1);
    setFilledRole(role);
  };

  return (
    <div>
      <GoogleCallback />
      <AuthHeader
        title="Log In"
        subtitle="Book local help or manage your services."
      />
      <DemoAccounts onUse={fillAccount} />
      <p className="sr-only" aria-live="polite">
        {filledRole ? `${filledRole} email and password are in the form.` : ''}
      </p>
      <FormBuilder
        key={formKey}
        elements={loginFormElements}
        layout={LoginLayout}
        formData={formData}
        setFormData={setFormData}
        loadingState={loading.login}
        onSubmit={handleSubmit}
      />
      <AuthOption
        title="New to Helpr?"
        linkText="Create an Account"
        linkHref={withNext(ROUTES.register, next)}
      />
    </div>
  );
}
