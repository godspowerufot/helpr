'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { LayoutProps } from '@msflib/react-components';
import { PhotoFormData, photoProblem, pickedPhoto } from './photo.form';

/** True after a submit attempt, so "Choose a photo first." shows only then. */
export const PhotoAttemptContext = createContext(false);

function PickedPhoto({ data }: { data: PhotoFormData }) {
  const attempted = useContext(PhotoAttemptContext);
  const file = pickedPhoto(data);
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : undefined),
    [file]
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );
  const problem = file || attempted ? photoProblem(file) : null;

  return (
    <div aria-live="polite" className="flex min-w-0 items-center gap-3">
      {file && preview && !problem ? (
        <>
          <Image
            src={preview}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-input-radius object-cover"
          />
          <p className="b2-r min-w-0 truncate text-text">{file.name}</p>
        </>
      ) : null}
      {problem ? <p className="b2-r text-error">{problem}</p> : null}
    </div>
  );
}

export function ProfilePhotoLayout({ FormField, formData }: LayoutProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FormField elementName="file" />
        <FormField elementName="submit" />
      </div>
      <PickedPhoto data={formData as PhotoFormData} />
    </div>
  );
}

export function WorkPhotoLayout({ FormField, formData }: LayoutProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FormField elementName="file" />
        <PickedPhoto data={formData as PhotoFormData} />
      </div>
      <FormField elementName="caption" />
      <div>
        <FormField elementName="submit" />
      </div>
    </div>
  );
}
