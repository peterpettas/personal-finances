import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { auth, signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarProvider,
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

  // const session = await auth();
  // const user = session?.user;

  // if (!user) {
  //   return (
  //     <html lang="en" className="h-full bg-gray-50">
  //       <body>
  //         <form
  //           action={async () => {
  //             'use server';
  //             await signIn('github');
  //           }}
  //         >
  //           <Button variant="outline">Sign In</Button>
  //         </form>
  //       </body>
  //     </html>
  //   );
  // }

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
