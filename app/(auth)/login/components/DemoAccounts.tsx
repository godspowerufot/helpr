'use client';

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../data/demo-accounts.data';

interface DemoAccountsProps {
  onUse: (email: string, password: string, label: string) => void;
}

export default function DemoAccounts({ onUse }: DemoAccountsProps) {
  return (
    <section
      aria-labelledby="demo-sign-in"
      className="mb-6 rounded-card border border-stroke bg-background-light p-4"
    >
      <h2 id="demo-sign-in" className="h6-m text-balance text-text">
        Demo Sign-In
      </h2>
      <p className="f1-r mt-1 text-text-light">
        Seeded accounts share this password. Use one to fill the form.
      </p>
      <p className="f1-m mt-4 text-text-light">Password</p>
      <p translate="no" className="b2-m mt-1 break-all text-text">
        {DEMO_PASSWORD}
      </p>
      <ul className="mt-2 flex flex-col">
        {DEMO_ACCOUNTS.map((account) => (
          <li
            key={account.email}
            className="mt-3 flex flex-col gap-1 border-t border-stroke-light pt-3"
          >
            <p className="f1-m text-text-light">{account.role}</p>
            <p className="b2-r text-text">{account.label}</p>
            <p translate="no" className="b2-r break-all text-text">
              {account.email}
            </p>
            <button
              type="button"
              onClick={() => onUse(account.email, DEMO_PASSWORD, account.role)}
              className="b2-m mt-1 min-h-11 self-start text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
            >
              Use {account.role} Account
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
