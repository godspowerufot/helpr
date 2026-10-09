'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { FormElement, LayoutProps } from '@msflib/react-components';
import FormBuilder from '@/dynamics/FormBuilder';
import { useReviewBooking } from '@/hooks/booking.hooks';
import { baseMData, buttonStyle } from '@/styles/form.styles';
import { errorMessage } from '@/utils/error.utils';

const ratingOptions = [5, 4, 3, 2, 1].map((n) => ({
  value: String(n),
  label: `${n} – ${['Poor', 'Fair', 'Good', 'Very good', 'Excellent'][n - 1]}`,
}));

const reviewElements: FormElement[] = [
  {
    id: 'rating',
    name: 'rating',
    label: 'Rating',
    eType: 'select',
    dType: 'string',
    mData: { ...baseMData, select: true, options: ratingOptions },
    validation: { required: { value: true, message: 'Pick a rating.' } },
  },
  {
    id: 'comment',
    name: 'comment',
    label: 'Comment (optional)',
    eType: 'textarea',
    dType: 'string',
    placeholder: 'What went well, what could be better…',
    mData: { ...baseMData, rows: 3 },
    validation: {
      maxLength: { value: 1000, message: 'Keep it under 1,000 characters.' },
    },
  },
  {
    id: 'submit',
    name: 'submit',
    label: 'Post Review',
    eType: 'button',
    dType: 'submit',
    mData: {
      variant: 'contained',
      sx: buttonStyle(),
    },
  },
];

function ReviewLayout({ FormField }: LayoutProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-60">
        <FormField elementName="rating" />
      </div>
      <FormField elementName="comment" />
      <div>
        <FormField elementName="submit" />
      </div>
    </div>
  );
}

export default function ReviewForm({
  bookingId,
  listingId,
}: {
  bookingId: number;
  listingId: number;
}) {
  const [formData, setFormData] = useState({ rating: '', comment: '' });
  const review = useReviewBooking(String(bookingId), listingId);

  return (
    <FormBuilder
      elements={reviewElements}
      layout={ReviewLayout}
      formData={formData}
      setFormData={setFormData}
      loadingState={review.isPending}
      onSubmit={(data: { rating: string; comment?: string }) =>
        review.mutate(
          { rating: Number(data.rating), comment: (data.comment ?? '').trim() },
          {
            onSuccess: () => toast.success('Thanks. Your review is live.'),
            onError: (error) =>
              toast.error(
                errorMessage(error, 'Your review was not saved. Try again.')
              ),
          }
        )
      }
    />
  );
}
