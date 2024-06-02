import './globals.css';

import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { Logo, SettingsIcon, UsersIcon, VercelLogo, AccountIcon, TransactionIcon, BillIcon, IncomeIcon, BudgetIcon } from '@/components/icons';
import { User } from './user';
import { NavItem } from './nav-item';

export const metadata = {
  title: 'Next.js App Router + NextAuth + Tailwind CSS',
  description:
    'A user admin dashboard configured with Next.js, Postgres, NextAuth, Tailwind CSS, TypeScript, and Prettier.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body>
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
          <div className="border-r bg-gray-100/40 block dark:bg-gray-800/40">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-[60px] items-center border-b px-5">
                <Link
                  className="flex items-center gap-2 font-semibold"
                  href="/"
                >
                  <Logo />
                  <span className="">ACME</span>
                </Link>
              </div>
              <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                  <NavItem href="/transactions">
                    <TransactionIcon className="h-4 w-4" />
                    Transactions
                  </NavItem>
                  <NavItem href="/bills">
                    <BillIcon className="h-4 w-4" />
                    Bills
                  </NavItem>
                  <NavItem href="/income">
                    <IncomeIcon className="h-4 w-4" />
                    Income
                  </NavItem>
                  <NavItem href="/budget">
                    <BudgetIcon className="h-4 w-4" />
                    Budget
                  </NavItem>
                  <NavItem href="/accounts">
                    <AccountIcon className="h-4 w-4" />
                    Accounts
                  </NavItem>
                  <NavItem href="/settings">
                    <SettingsIcon className="h-4 w-4" />
                    Settings
                  </NavItem>
                </nav>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 justify-between lg:justify-end">
              <Link
                className="flex items-center gap-2 font-semibold lg:hidden"
                href="/"
              >
                <Logo />
                <span className="">ACME</span>
              </Link>
              <User />
            </header>
            {children}
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
