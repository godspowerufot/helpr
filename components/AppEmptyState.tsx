import AppButton from '@/components/AppButton';

interface AppEmptyStateProps {
  message: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function AppEmptyState({
  message,
  actionHref,
  actionLabel,
}: AppEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p className="b1-r max-w-[65ch] text-text-light">{message}</p>
      {actionHref && actionLabel ? (
        <AppButton variant="outlined" href={actionHref}>
          {actionLabel}
        </AppButton>
      ) : null}
    </div>
  );
}
