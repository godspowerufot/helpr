import { Suspense } from 'react';
import { AppSkeleton } from '@msflib/react-components';
import ListingManage from './components/ListingManage';

export default function ListingManagePage() {
  return (
    <Suspense fallback={<AppSkeleton.Text lines={8} />}>
      <ListingManage />
    </Suspense>
  );
}
