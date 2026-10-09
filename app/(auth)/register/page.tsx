import { Suspense } from 'react';
import SignUp from './components/SignUp';

export default function RegisterPage() {
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  );
}
