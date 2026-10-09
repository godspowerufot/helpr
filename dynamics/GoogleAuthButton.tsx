import dynamic from 'next/dynamic';

const GoogleAuthButton = dynamic(
  () => import('@msflib/react-components').then((mod) => mod.GoogleAuthButton),
  { ssr: false }
);

export default GoogleAuthButton;
