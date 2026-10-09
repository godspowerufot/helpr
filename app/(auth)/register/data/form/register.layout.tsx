import { LayoutProps } from '@msflib/react-components';
import GoogleLoginButton from '../../../components/GoogleLoginButton';

export const RegisterLayout: React.FC<LayoutProps> = ({ FormField }) => (
  <section className="flex flex-col gap-2">
    <FormField elementName="username" />
    <FormField elementName="email" />
    <FormField elementName="password" />
    <FormField elementName="confirm_password" />
    <FormField elementName="terms" />
    <FormField elementName="submit" />
    <GoogleLoginButton />
  </section>
);
