import Link from 'next/link';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => (
  <div className="mb-8 text-center">
    <h1 className="h2-r text-balance text-text">{title}</h1>
    <p className="b2-r mt-2 text-text-light">{subtitle}</p>
  </div>
);

interface AuthOptionProps {
  title: string;
  linkText: string;
  linkHref: string;
}

export const AuthOption = ({ title, linkText, linkHref }: AuthOptionProps) => (
  <p className="b2-r mt-4 text-center text-text">
    {title}{' '}
    <Link
      href={linkHref}
      className="b2-m text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
    >
      {linkText}
    </Link>
  </p>
);
