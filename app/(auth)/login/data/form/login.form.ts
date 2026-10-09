import { FormElement } from '@msflib/react-components';
import { baseMData, buttonStyle } from '@/styles/form.styles';

export const loginFormElements: FormElement[] = [
  {
    id: 'email',
    name: 'email',
    label: 'Email',
    eType: 'email',
    dType: 'string',
    placeholder: 'you@example.com',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Email is required' },
    },
  },
  {
    id: 'password',
    name: 'password',
    label: 'Password',
    eType: 'password',
    dType: 'string',
    placeholder: 'Your password',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Password is required' },
    },
  },
  {
    id: 'submit',
    name: 'submit',
    label: 'Log In',
    eType: 'button',
    dType: 'submit',
    mData: {
      variant: 'contained',
      sx: buttonStyle(),
    },
  },
];
