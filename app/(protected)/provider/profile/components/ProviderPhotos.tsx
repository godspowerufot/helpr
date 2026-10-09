'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import AppButton from '@/components/AppButton';
import AppConfirmDialog from '@/components/AppConfirmDialog';
import FormBuilder from '@/dynamics/FormBuilder';
import {
  useAddWorkPhoto,
  useRemoveProfilePhoto,
  useRemoveWorkPhoto,
  useSetProfilePhoto,
} from '@/hooks/provider.hooks';
import { ProviderMine, ProviderPhoto } from '@/types/provider.types';
import { errorMessage } from '@/utils/error.utils';
import { mediaUrl } from '@/utils/media.utils';
import { Card } from '../../../components/Page';
import {
  MAX_WORK_PHOTOS,
  PhotoFormData,
  photoProblem,
  pickedPhoto,
  profilePhotoElements,
  workPhotoElements,
} from '../../data/form/photo.form';
import {
  PhotoAttemptContext,
  ProfilePhotoLayout,
  WorkPhotoLayout,
} from '../../data/form/photo.layout';

const UPLOAD_FAILED = 'The photo was not uploaded. Try again.';
const REMOVE_FAILED = 'The photo was not removed. Try again.';

/** Upload form state; `reset` remounts FormBuilder to clear its picked files. */
function usePhotoForm() {
  const [key, setKey] = useState(0);
  const [formData, setFormData] = useState<PhotoFormData>({});
  const [attempted, setAttempted] = useState(false);
  return {
    key,
    formData,
    setFormData,
    attempted,
    setAttempted,
    reset: () => {
      setFormData({});
      setAttempted(false);
      setKey((k) => k + 1);
    },
  };
}

function BusinessPhoto({ provider }: { provider: ProviderMine }) {
  const upload = useSetProfilePhoto();
  const remove = useRemoveProfilePhoto();
  const form = usePhotoForm();
  const [confirming, setConfirming] = useState(false);

  return (
    <Card title="Business Photo">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {provider.photo_url ? (
          <Image
            src={mediaUrl(provider.photo_url)}
            alt={`${provider.display_name} business photo`}
            width={112}
            height={112}
            className="size-28 shrink-0 rounded-card object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h3-r grid size-28 shrink-0 place-items-center rounded-card bg-background-light text-text-light"
          >
            {provider.display_name.charAt(0)}
          </div>
        )}
        <div className="flex min-w-0 flex-col items-start gap-3">
          <p className="b2-r max-w-[60ch] text-text-light">
            Shown at the top of your public page. A clear photo of you or your
            team earns more trust than a logo. JPEG, PNG or WebP, up to
            5&nbsp;MB.
          </p>
          <PhotoAttemptContext.Provider value={form.attempted}>
            <FormBuilder
              key={form.key}
              elements={profilePhotoElements(Boolean(provider.photo_url))}
              layout={ProfilePhotoLayout}
              formData={form.formData}
              setFormData={form.setFormData}
              loadingState={upload.isPending}
              onSubmit={(data: PhotoFormData) => {
                const file = pickedPhoto(data);
                form.setAttempted(true);
                if (!file || photoProblem(file)) return;
                upload.mutate(file, {
                  onSuccess: () => {
                    toast.success('Business photo updated.');
                    form.reset();
                  },
                  onError: (error) =>
                    toast.error(errorMessage(error, UPLOAD_FAILED)),
                });
              }}
            />
          </PhotoAttemptContext.Provider>
          {provider.photo_url ? (
            <AppButton variant="text" onClick={() => setConfirming(true)}>
              Remove Photo
            </AppButton>
          ) : null}
        </div>
      </div>
      <AppConfirmDialog
        open={confirming}
        title="Remove business photo?"
        message="Your public page will show your initial until you upload a new photo."
        confirmLabel="Remove Photo"
        cancelLabel="Keep Photo"
        loading={remove.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              toast.success('Business photo removed.');
              setConfirming(false);
            },
            onError: (error) => toast.error(errorMessage(error, REMOVE_FAILED)),
          })
        }
      />
    </Card>
  );
}

function WorkPhotos({ provider }: { provider: ProviderMine }) {
  const add = useAddWorkPhoto();
  const remove = useRemoveWorkPhoto();
  const form = usePhotoForm();
  const [removing, setRemoving] = useState<ProviderPhoto | null>(null);
  const photos = provider.photos;
  const full = photos.length >= MAX_WORK_PHOTOS;

  return (
    <Card title="Work Photos">
      <p className="b2-r max-w-[60ch] text-text-light">
        Before-and-after shots and finished jobs help customers choose you. Up
        to {MAX_WORK_PHOTOS} photos;{' '}
        <span className="tabular-nums">{photos.length}</span> added.
      </p>

      {photos.length === 0 ? (
        <p className="b2-r mt-4 rounded-card bg-background-light p-4 text-text-light">
          No work photos yet. Add your first one below.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex min-w-0 flex-col gap-2">
              <Image
                src={mediaUrl(photo.url)}
                alt={photo.caption || `Work photo ${index + 1}`}
                width={320}
                height={240}
                className="aspect-[4/3] w-full rounded-card object-cover"
              />
              {photo.caption ? (
                <p className="f1-r break-words text-text-light">
                  {photo.caption}
                </p>
              ) : null}
              <div>
                <AppButton
                  variant="text"
                  size="small"
                  onClick={() => setRemoving(photo)}
                >
                  Remove
                  <span className="sr-only">
                    {' '}
                    {photo.caption || `work photo ${index + 1}`}
                  </span>
                </AppButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-ink/10 pt-6">
        {full ? (
          <p className="b2-r text-text-light">
            You have {MAX_WORK_PHOTOS} photos. Remove one to add another.
          </p>
        ) : (
          <PhotoAttemptContext.Provider value={form.attempted}>
            <FormBuilder
              key={form.key}
              elements={workPhotoElements()}
              layout={WorkPhotoLayout}
              formData={form.formData}
              setFormData={form.setFormData}
              loadingState={add.isPending}
              onSubmit={(data: PhotoFormData) => {
                const file = pickedPhoto(data);
                form.setAttempted(true);
                if (!file || photoProblem(file)) return;
                add.mutate(
                  { file, caption: (data.caption ?? '').trim() },
                  {
                    onSuccess: () => {
                      toast.success('Work photo added.');
                      form.reset();
                    },
                    onError: (error) =>
                      toast.error(errorMessage(error, UPLOAD_FAILED)),
                  }
                );
              }}
            />
          </PhotoAttemptContext.Provider>
        )}
      </div>

      <AppConfirmDialog
        open={removing !== null}
        title="Remove this photo?"
        message="It will no longer show on your public page."
        confirmLabel="Remove Photo"
        cancelLabel="Keep Photo"
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success('Work photo removed.');
              setRemoving(null);
            },
            onError: (error) => toast.error(errorMessage(error, REMOVE_FAILED)),
          })
        }
      />
    </Card>
  );
}

export default function ProviderPhotos({
  provider,
}: {
  provider: ProviderMine;
}) {
  return (
    <>
      <BusinessPhoto provider={provider} />
      <WorkPhotos provider={provider} />
    </>
  );
}
