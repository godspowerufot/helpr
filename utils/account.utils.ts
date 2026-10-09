import { Me } from '@msflib/react-auth';

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function accountName(me: Me) {
  const profile = me.profile;
  if (profile && typeof profile === 'object') {
    const record = profile as Record<string, unknown>;
    const first = text(record.first_name) ?? text(record.firstname);
    const last = text(record.last_name) ?? text(record.lastname);
    const combined = [first, last].filter(Boolean).join(' ');
    if (combined) return combined;
  }
  return me.username;
}

export function accountInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
