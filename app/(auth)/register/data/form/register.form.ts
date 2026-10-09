import { FormElement } from '@msflib/react-components';
import { baseMData, buttonStyle } from '@/styles/form.styles';

export const registerFormElements: FormElement[] = [
  {
    id: 'username',
    name: 'username',
    label: 'Username',
    eType: 'text',
    dType: 'string',
    placeholder: 'ada_lovelace',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Username is required' },
      minLength: { value: 2, message: 'Username is too short' },
    },
  },
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
      pattern: { value: /^\S+@\S+$/, message: 'Invalid email address' },
    },
  },
  {
    id: 'password',
    name: 'password',
    label: 'Password',
    eType: 'password',
    dType: 'string',
    placeholder: 'At least 6 characters',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Password is required' },
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters',
      },
    },
  },
  {
    id: 'confirm_password',
    name: 'confirm_password',
    label: 'Confirm Password',
    eType: 'password',
    dType: 'string',
    placeholder: 'Repeat your password',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Please confirm your password' },
      validate: (value: string, values: { password: string }) =>
        value === values.password || 'Passwords do not match',
    },
  },
  {
    id: 'terms',
    name: 'terms',
    label: 'I agree to the Terms & Conditions',
    eType: 'checkbox',
    dType: 'boolean',
    mData: {},
    validation: {
      required: { value: true, message: 'You must accept the terms' },
    },
  },
  {
    id: 'submit',
    name: 'submit',
    label: 'Create Account',
    eType: 'button',
    dType: 'submit',
    mData: {
      variant: 'contained',
      sx: buttonStyle(),
    },
  },
];
