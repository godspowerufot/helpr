import Link from 'next/link';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { PILL_DARK, PILL_GLASS } from '@/styles/glass.styles';

interface PillLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'arrow' | 'dark' | 'glass';
  className?: string;
  onClick?: () => void;
}

export default function PillLink({
  href,
  children,
  variant = 'dark',
  className = '',
  onClick,
}: PillLinkProps) {
  if (variant === 'arrow') {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`group ${PILL_DARK} min-h-12 pr-1.5 pl-6 ${className}`}
      >
        {children}
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-glass text-ink"
        >
          <ArrowForwardRounded
            sx={{ fontSize: 18 }}
            className="transition-transform duration-300 group-hover:-rotate-45"
          />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${variant === 'glass' ? PILL_GLASS : PILL_DARK} ${className}`}
    >
      {children}
    </Link>
  );
}
