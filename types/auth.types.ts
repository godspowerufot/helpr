import { RegisterPayload } from '@msflib/react-auth';

export type SignUpAs = 'client' | 'provider';

export interface RegisterFormValues extends RegisterPayload {
  email: string;
  confirm_password: string;
  terms: boolean;
}
