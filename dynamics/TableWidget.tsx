import dynamic from 'next/dynamic';

const TableWidget = dynamic(
  () => import('@msflib/react-components').then((mod) => mod.TableWidget),
  { ssr: false }
);

export default TableWidget;
