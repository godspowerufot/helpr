import Link from 'next/link';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import AppButton from '@/components/AppButton';
import { GLASS_CARD } from '@/styles/glass.styles';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  back,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {back ? (
        <Link
          href={back.href}
          className="b2-m inline-flex min-h-11 w-fit items-center gap-1 text-text-light transition-colors duration-150 hover:text-text"
        >
          <ArrowBackOutlined fontSize="small" aria-hidden="true" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="h4-r text-balance break-words text-text">{title}</h1>
          {description ? (
            <p className="b2-r mt-1 max-w-[65ch] text-text-light">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${GLASS_CARD} p-5 sm:p-6 ${className}`}>
      {title ? (
        <h2 className="h5-m mb-4 text-balance text-text">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-6">
      <p className="b1-r text-error">{message}</p>
      <AppButton variant="outlined" onClick={onRetry}>
        Try Again
      </AppButton>
    </div>
  );
}

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-stroke-light py-3 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:gap-4">
      <dt className="b2-r w-32 shrink-0 text-text-light">{label}</dt>
      <dd className="b2-m min-w-0 break-words text-text">{children}</dd>
    </div>
  );
}
