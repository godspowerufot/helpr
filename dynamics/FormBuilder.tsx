import dynamic from 'next/dynamic';

const FormBuilder = dynamic(
  () => import('@msflib/react-components').then((mod) => mod.FormBuilder),
  { ssr: false }
);

export default FormBuilder;
