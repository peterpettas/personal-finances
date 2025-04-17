import './globals.css';
import { StackProvider, StackTheme } from '@stackframe/stack';
import { stackServerApp } from '../stack';
import { Analytics } from '@vercel/analytics/react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata = {
  title: 'Peter & Ana | Personal Finances',
  description:
    'Peter & Ana Personal Finances is a personal finance app that helps you manage your money, budget, and expenses.'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {

  const user = await stackServerApp.getUser();

  if (!user) {
    return (
      <html lang="en" className="h-full bg-gray-50">
        <body>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              {children}
            </StackTheme>
          </StackProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full bg-gray-50">
      <body>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <SidebarProvider>
              <AppSidebar />
              {children}
            </SidebarProvider>
            <Analytics />
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
