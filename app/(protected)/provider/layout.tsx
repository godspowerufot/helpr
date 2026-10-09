import { ProviderGate } from './components/ProviderGate';

export default function ProviderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProviderGate>{children}</ProviderGate>;
}
