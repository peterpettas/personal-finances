import { getUsers } from '@/lib/db';
import { UsersTable } from './users-table';
import { Search } from './search';
import { stackServerApp } from 'stack';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Analytics } from '@vercel/analytics/react';

export default async function IndexPage({
  searchParams
}: {
  searchParams: { q: string; offset: string };
}) {
  const search = searchParams.q ?? '';
  const offset = searchParams.offset ?? 0;
  const { users, newOffset } = await getUsers(search, Number(offset));
  const user = await stackServerApp.getUser();

  return (
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <div className="flex items-center mb-8">
          <h1 className="font-semibold text-lg md:text-2xl">Users</h1>
        </div>
        <div className="w-full mb-4">
          <Search value={searchParams.q} />
        </div>
        <UsersTable users={users} offset={newOffset} />
      </main>
  );
}
