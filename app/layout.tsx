import './globals.css';

import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { Logo, SettingsIcon, UsersIcon, VercelLogo, AccountIcon, TransactionIcon, BillIcon, IncomeIcon, BudgetIcon } from '@/components/icons';
import { User } from './user';
import { NavItem } from './nav-item';
import { auth, signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';

export const metadata = {
  title: 'Peter & Ana | Personal Finances',
  description:
    'Peter & Ana Personal Finances is a personal finance app that helps you manage your money, budget, and expenses.',
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {

  const session = await auth();
  const user = session?.user;

  if (!user) {
    return (
      <html lang="en" className="h-full bg-gray-50">
        <body>
          <form
            action={async () => {
              'use server';
              await signIn('github');
            }}
          >
            <Button variant="outline">Sign In</Button>
          </form>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full bg-gray-50">
      <body>
        <SidebarProvider>
          <AppSidebar />
          {children}
        </SidebarProvider>
        <Analytics />
      </body>
    </html>
  );
}
