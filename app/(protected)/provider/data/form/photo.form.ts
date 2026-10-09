import { FormElement } from '@msflib/react-components';
import { baseMData, outlinedButtonStyle } from '@/styles/form.styles';

export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_WORK_PHOTOS = 8;

export type PhotoFormData = { file?: File[]; caption?: string };

const fileElement = (label: string): FormElement => ({
  id: 'file',
  name: 'file',
  label,
  eType: 'upload',
  dType: 'file',
  mData: {
    accept: PHOTO_ACCEPT,
    // Spread onto the DOM by MSFLib; `false` triggers a React attribute warning, while an
    // explicit undefined still overrides the `true` default and renders no attribute.
    preview_upload: undefined,
    variant: 'outlined',
    sx: outlinedButtonStyle(),
  },
});

const submitElement = (label: string): FormElement => ({
  id: 'submit',
  name: 'submit',
  label,
  eType: 'button',
  dType: 'submit',
  mData: {
    variant: 'outlined',
    sx: outlinedButtonStyle(),
  },
});

export const profilePhotoElements = (hasPhoto: boolean): FormElement[] => [
  fileElement(hasPhoto ? 'Choose New Photo' : 'Choose Photo'),
  submitElement('Upload Photo'),
];

export const workPhotoElements = (): FormElement[] => [
  fileElement('Choose Photo'),
  {
    id: 'caption',
    name: 'caption',
    label: 'Caption (optional)',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. Kitchen after a deep clean…',
    mData: baseMData,
    validation: {
      maxLength: { value: 140, message: 'Keep it under 140 characters.' },
    },
  },
  submitElement('Add Photo'),
];

/** The upload field accumulates picks; the latest one is the file to send. */
export function pickedPhoto(data: PhotoFormData): File | undefined {
  return data.file?.at(-1);
}

/** Mirrors the server's 413/415 checks so the provider sees the reason before uploading. */
export function photoProblem(file?: File): string | null {
  if (!file) return 'Choose a photo first.';
  if (!PHOTO_ACCEPT.split(',').includes(file.type))
    return 'Use a JPEG, PNG or WebP image.';
  if (file.size > MAX_PHOTO_BYTES) return 'Use an image under 5\u00a0MB.';
  return null;
}
