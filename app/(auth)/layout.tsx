import AuthWrapper from './components/AuthWrapper';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthWrapper>{children}</AuthWrapper>;
}
