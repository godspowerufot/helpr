// Seeded marketplace accounts (backend/app/seed/data/marketplace.json).
// Every seeded account uses SEED_ACCOUNT_PASSWORD from backend/.env.
export const DEMO_PASSWORD = 'HelprDemo2026!';

export const DEMO_ACCOUNTS = [
  {
    role: 'Customer',
    label: 'Chiamaka Eze',
    email: 'chiamaka@example.com',
  },
  {
    role: 'Provider',
    label: 'Sparkle Home Services',
    email: 'sparkle@example.com',
  },
] as const;
