import Image from 'next/image';
import Link from 'next/link';
import { ReactTemplateLight, ReactTemplateDark } from '@/assets/';

interface AppLogoProps {
  width?: number;
  height?: number;
  href?: string;
  type?: 'light' | 'dark';
}
const AppLogo = ({
  width = 100,
  height = 100,
  href = '/',
  type = 'light',
}: AppLogoProps) => {
  const logo = type === 'dark' ? ReactTemplateDark : ReactTemplateLight;

  return (
    <Link href={href} passHref>
      <Image
        src={logo}
        alt="App logo"
        width={width}
        height={height}
        className="block"
        priority
      />
    </Link>
  );
};
export default AppLogo;
