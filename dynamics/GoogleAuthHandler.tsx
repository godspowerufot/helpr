import dynamic from 'next/dynamic';

const GoogleAuthHandler = dynamic(
  () => import('@msflib/react-components').then((mod) => mod.GoogleAuthHandler),
  { ssr: false }
);

export default GoogleAuthHandler;
